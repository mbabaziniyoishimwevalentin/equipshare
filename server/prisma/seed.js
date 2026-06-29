"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    const adminEmail = 'admin@equipshare.com';
    const adminPassword = 'adminpassword123';
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail },
    });
    if (!existingAdmin) {
        const salt = await bcrypt_1.default.genSalt(10);
        const passwordHash = await bcrypt_1.default.hash(adminPassword, salt);
        await prisma.user.create({
            data: {
                email: adminEmail,
                passwordHash,
                firstName: 'System',
                lastName: 'Admin',
                role: 'ADMIN',
                isVerified: true,
            },
        });
        console.log(`Admin user created: ${adminEmail} / ${adminPassword}`);
    }
    else {
        console.log('Admin user already exists.');
    }
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map