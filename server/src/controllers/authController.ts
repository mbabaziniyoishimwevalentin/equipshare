import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { sendEmail } from '../utils/email';

const createRandomCode = () => Math.floor(100000 + Math.random() * 900000).toString();
const maskEmail = (email: string) => {
  if (!email || !email.includes('@')) return '*****@*****';
  const [local, domain] = email.split('@');
  const visible = local ? local.slice(0, 2) : '';
  const maskedLocal = visible + '*'.repeat(Math.max(0, (local || '').length - 2));
  return `${maskedLocal}@${domain}`;
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role, phone, address, dateOfBirth, preferredCommunication, nationalId, profilePictureUrl, identityDocumentUrl, acceptedTerms } = req.body;

    if (!acceptedTerms) {
      return res.status(400).json({ error: 'You must accept the terms of service and community guidelines' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [firstName, ...lastNameParts] = (name || '').split(' ');
    const lastName = lastNameParts.join(' ');

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: firstName || '',
        lastName: lastName || '',
        role: role || 'RENTER',
        phone,
        address,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        preferredCommunication,
        nationalId,
        profilePictureUrl,
        identityDocumentUrl,
        acceptedTerms,
      },
    });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    return res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        firstName: user.firstName, 
        lastName: user.lastName 
      } 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

export const verifyLoginCode = async (req: Request, res: Response) => {
  try {
    const { userId, code } = req.body;
    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user || !user.email2faCode || !user.email2faCodeExpires) {
      return res.status(400).json({ error: 'Invalid or expired 2FA code' });
    }

    if (user.email2faCode !== code || user.email2faCodeExpires < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired 2FA code' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { email2faCode: null, email2faCodeExpires: null },
    });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error validating login code' });
  }
};

export const resendLoginCode = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user) {
      return res.status(400).json({ error: 'Unable to resend code for this user' });
    }

    const code = createRandomCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { email2faCode: code, email2faCodeExpires: expiresAt },
    });

    await sendEmail(
      user.email,
      'EquipShare login code',
      `<p>Your new EquipShare verification code is <strong>${code}</strong>.</p><p>This code expires in 10 minutes.</p>`
    );

    res.json({ message: 'A new verification code has been sent to your email.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error resending login code' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user?.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        profilePictureUrl: true,
        preferredCommunication: true,
        nationalId: true,
        identityDocumentUrl: true,
        isVerified: true,
        acceptedTerms: true,
        email2faEnabled: true,
        dateOfBirth: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateMe = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user?.id;
    const { firstName, lastName, phone, address, preferredCommunication, profilePictureUrl, identityDocumentUrl } = req.body;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { firstName, lastName, phone, address, preferredCommunication, profilePictureUrl, identityDocumentUrl },
      select: {
        id: true, firstName: true, lastName: true, email: true,
        phone: true, address: true, role: true, profilePictureUrl: true,
        preferredCommunication: true, isVerified: true, createdAt: true,
      },
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const send2FAEmailCode = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user?.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const code = createRandomCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { email2faCode: code, email2faCodeExpires: expiresAt },
    });

    await sendEmail(
      user.email,
      'EquipShare 2FA code',
      `<p>Your EquipShare verification code is <strong>${code}</strong>. Use it to confirm your 2FA change.</p><p>This code expires in 10 minutes.</p>`
    );

    res.json({ message: 'Verification code sent to your email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not send 2FA code' });
  }
};

export const enable2FA = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user?.id;
    const { code } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.email2faCode || !user.email2faCodeExpires) {
      return res.status(400).json({ error: 'Invalid or expired 2FA code' });
    }

    if (user.email2faCode !== code || user.email2faCodeExpires < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired 2FA code' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { email2faEnabled: true, email2faCode: null, email2faCodeExpires: null },
    });

    res.json({ message: 'Email 2FA enabled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not enable 2FA' });
  }
};

export const disable2FA = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user?.id;
    const { code } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.email2faCode || !user.email2faCodeExpires) {
      return res.status(400).json({ error: 'Invalid or expired 2FA code' });
    }

    if (user.email2faCode !== code || user.email2faCodeExpires < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired 2FA code' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { email2faEnabled: false, email2faCode: null, email2faCodeExpires: null },
    });

    res.json({ message: 'Email 2FA disabled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not disable 2FA' });
  }
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(200).json({ message: 'If that email exists, a reset code has been sent.' });

    const code = createRandomCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetCode: code, passwordResetExpires: expiresAt },
    });

    await sendEmail(
      user.email,
      'EquipShare password reset code',
      `<p>Your password reset code is <strong>${code}</strong>. It expires in 15 minutes.</p>`
    );

    res.json({ message: 'If that email exists, a reset code has been sent.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to process password reset request' });
  }
};

export const confirmPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordResetCode || !user.passwordResetExpires) {
      return res.status(400).json({ error: 'Invalid or expired password reset code' });
    }

    if (user.passwordResetCode !== code || user.passwordResetExpires < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired password reset code' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetCode: null,
        passwordResetExpires: null,
      },
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to reset password' });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};