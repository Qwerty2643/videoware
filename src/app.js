import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser"


const app = express();


app.use(
    cors({
        origin:process.env.CORS_ORIGIN ,
        credentials:true
    })
)

//common middlewares

app.use(express.json({                 //parses json data from request body
    limit:"16kb"
}))
app.use(express.urlencoded({          //parses url encoded data 
    extended:true,
    limit:"16kb"
}))
app.use(express.static("public"))       //serve static files like html,css that are present in the public dir

app.use(cookieParser())
// import routes
import healthcheckRouter from './routes/healthcheck.routes.js'
import userRouter from './routes/users.routes.js'


//routes
app.use("/api/v1/healthcheck",healthcheckRouter)
app.use("/api/v1/users",userRouter)


export default app; // Export the `app` instance directly
