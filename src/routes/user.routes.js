import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router =Router();

router.route("/register").post(upload.fields(
    [{
        name:"avatar",
        maxCount:1
    },{
        name:"coverImage",
        maxCount:1
        // Now images can be sent
}]),
 registerUser
)
export default router