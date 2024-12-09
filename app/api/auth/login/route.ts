import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { setCookie } from "cookies-next";

// Login
export async function POST(request: Request) {
    
    const prisma = new PrismaClient();

    const user = await request.json();

    // Input validation
    if (!user.username || !user.password) {
        return NextResponse.json(
            { message: "Missing username and password" },
            { status: 400 }
        );
    }

    try {
        // Check if the user exists in the database
        const exsituser = await prisma.user.findFirst({
            where: { username: user.username },
        });

        if (!exsituser) { //check user exsit
            return NextResponse.json(
                { message: "No existing user" },
                { status: 401 }
            );
        }

        const isMatch = user.password === exsituser.password;

        if (!isMatch) {
            return NextResponse.json(
                { message: "Password doesn't match" },
                { status: 401 }
            );
        }

        const JWT_SECRET = process.env.JWT_SECRET;
        const token = jwt.sign(
            { userId: exsituser.id, username: exsituser.username },
            JWT_SECRET,
            {expiresIn: "2h" }, // Token expiration set to 2 hour
        );

        return NextResponse.json(
            { message: "Login successful", token },
            { status: 200 }
        );
    } catch (err) {
        console.error("LOGIN ERROR: ", err);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}