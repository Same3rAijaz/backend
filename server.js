import express from "express"
import cors from "cors"
import { config } from "dotenv"
import UserModal from "./Model/User.Model.js"
import VotingModal from "./Model/Voting.Model.js"
import mongoose from "mongoose"
config()

const app = express()
app.use(cors())
app.use(express.json())
app.post('/create-candidate', async (req, res) => {
    try {
        const { cnic, name, title } = req?.body
        const User = await UserModal.findOne({ cnic })
        if (User) {
            throw new Error('User Already Exdisted As Caster / Voter')
        } else {
            await new UserModal({ cnic, name, role: true, title }).save()
            return res.status(200).json({ message: "Candidate Added" })
        }
    } catch (error) {
        return res.status(400).json({ message: error?.message })
    }
})

app.post('/vote', async (req, res) => {
    try {
        const response = await UserModal.findOne({ cnic: req?.body?.cnic })
        if (response) {
            if (response.role) {
                throw new Error("Candidate Can Not Cast Vote")
            } else {
                throw new Error("Vote Already Casted!")
            }
        } else {
            const voter = await new UserModal({ cnic: req?.body?.cnic, name: req?.body?.name, title: req?.body?.title }).save()
            const Voted = await VotingModal.findOne({ user_id: voter?._id })
            if (Voted) {
                throw new Error("Already Voted!")
            } else {
                const votedFor = await VotingModal.findById(req?.body?.voted_for)
                if (!votedFor) {
                    await new VotingModal({ user_id: voter?._id, voted_for: req?.body?.voted_for }).save()
                    return res.status(200).json({ data: null, message: "Vote Casted!" })
                } else {
                    throw new Error("Candidate Suspended!")
                }
            }
        }
    } catch (error) {
        return res.status(400).json({ data: null, message: error?.message })
    }
})
app.get('/get-all', async (req, res) => {
    try {
        const { type } = req.query
        let data = null
        if (type == 'candidates') {
            data = await UserModal.find({ role: true })
        } else if (type == 'voters') {
            data = await UserModal.find({ role: false })
        } else if (type == 'votes') {
            await VotingModal.aggregate([
                {
                    $group: {
                        _id: {
                            voted_for: "$voted_for",
                            user_id: "$user_id"
                        }
                    }
                },
                {
                    $group: {
                        _id: "$_id.voted_for",
                        users: { $push: "$_id.user_id" }
                    }
                },
                {
                    $lookup: {
                        from: "candidates",
                        localField: "_id",
                        foreignField: "_id",
                        as: "candidate_details"
                    }
                },
                {
                    $lookup: {
                        from: "candidates",
                        localField: "users",
                        foreignField: "_id",
                        as: "user_details"
                    }
                }
            ])
                .exec().then((result, err) => {
                    if (err) {
                        // Handle error
                        console.log(err?.message)
                        throw new Error(err?.message)
                    } else {
                        data = result
                        // Process the result
                        // return res.status(200).send({ data: result, message: "Success!" })
                    }
                }
                )

        }
        return res.status(200).send({ data, message: "Success!" })
    } catch (error) {
        return res.status(400).json({ message: error?.message })
    }
})
const port = process.env.PORT || 5000
app.listen(port, () => {
    try {
        mongoose.connect(process.env.MONGO_URI).then(() => {
            console.log("DataBase Is Connected")
        })
    } catch (error) {
        console.log(error?.message)
    }
    console.log(`Server Is Runing On Port:`, port)
})