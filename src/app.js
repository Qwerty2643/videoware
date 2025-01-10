import express from "express";
import cors from "cors"

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

// import routes
import healthcheckRouter from './routes/healthcheck.routes.js'



//routes
app.use("/api/v1/healthcheck",healthcheckRouter)



export default app; // Export the `app` instance directly
