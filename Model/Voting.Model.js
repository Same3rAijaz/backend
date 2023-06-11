import { Schema, model } from "mongoose";

const VotingSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, require: true },
    voted_for: { type: Schema.Types.ObjectId, require: true }
})

const VotingModel = model('votes', VotingSchema)
export default VotingModel