import  ApiResponse from '../utils/ApiResponse.js'
import  asyncHandler from '../utils/asyncHandler.js'

const healthcheck = asyncHandler( async(req,res)=>{
    return res
     .status(200)
     .json(new ApiResponse(200,"data:ok","Health check passed"))
})

// alternate:(without using asynchandler,uses normal try-catch)
// 
// const healthcheck =async (req,res,next) => { try {
//     return res
//         .status(200)
//         .json(new ApiResponse(200,"data:ok","Health check passed - normal method"))
// } catch (error) {
//     next(error)
// }
// }

export default healthcheck