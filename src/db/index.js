import mongoose from "mongoose"
import { DB_NAME } from "../constants.js"



const connectDB = async () =>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log("connected to database successfully")
       

    } catch (error) {
        console.log("MONGODB CONNECTION ERROR",error)
        process.exit(1)
    }
}

export default connectDB;