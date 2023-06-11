import { Schema, model } from "mongoose";

const UserSchema = new Schema({
    name: { type: String, require: true },
    title: { type: String },
    cnic: { type: String, require: true },
    role: { type: Boolean, require: true, default: false }
})

const UserModel = model('candidates', UserSchema)
export default UserModel