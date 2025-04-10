/*
 * Complete this script so that it is able to add a superuser to the database
 * Usage example: 
 *   node prisma/createsu.js clive123 clive.su@mail.utoronto.ca SuperUser123!
 */
'use strict';

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

const main = async () => {
  const args = process.argv.slice(2);

  if (args.length !== 3) {
    console.error("Usage: node prisma/createsu.js <utorid> <email> <password>");
    process.exit(1);
  }

  const [utorid, email, plainPassword] = args;

  try {
    const existing = await prisma.user.findUnique({ where: { utorid } });
    if (existing) {
      console.error(`User with utorid '${utorid}' already exists.`);
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const user = await prisma.user.create({
      data: {
        utorid,
        name: "Superuser",
        email,
        password: hashedPassword,
        role: "SUPERUSER",
        verified: true,
        lastLogin: null,
      },
    });

    await prisma.user.update({
      where: { utorid },
      data: { lastLogin: null }, 
    });
    
    const confirmed = await prisma.user.findUnique({
      where: { utorid },
    });
    

    console.log(`Superuser '${utorid}' created successfully!`);
    console.log(`lastLogin: ${confirmed.lastLogin}`);

  } catch (err) {
    console.error("Failed to create superuser:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

main();
