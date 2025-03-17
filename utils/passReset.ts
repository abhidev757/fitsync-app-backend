import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Admin from "../models/AdminModel";

const resetAdminPassword = async () => {
    await mongoose.connect("mongodb://localhost:27017/FitsyncDatabase");

    const admin = await Admin.findOne({ email: "admin@example.com" });
    if (!admin) {
        console.log("❌ Admin not found!");
        process.exit();
    }

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash("admin123", salt);
    await admin.save();

    console.log("✅ Admin password reset to 'admin123'");
    process.exit();
};

resetAdminPassword();
