/**
 * @module       services
 * @file         user.js
 * @description  holds the methods calling from controller
 * @author       Payal Ghusalikar <payal.ghusalikar9@gmail.com>
*  @since        27/01/2021  
-----------------------------------------------------------------------------------------------*/

const User = require("../models/user.js");
const helper = require("../../middleware/helper.js");
const bcrypt = require("bcrypt");
const logger = require("../../../logger/logger.js");
const jwt = require("jsonwebtoken");
const redis = require("redis");
const client = redis.createClient();
var redisCache = require("../../middleware/redisCache.js");

class userService {
    /**
     * @description register and save User then send response to controller
     * @method register is used to save the User
     * @param callback is the callback for controller
     */
    register = (userInfo, callback) => {
        User.save(userInfo, (error, data) => {
            if (error) return callback(error, null);
            return callback(null, data);
        });
    };

    /**
     * @description takes userInfo and calls model class method
     * @param {*} userLoginInfo
     * @param {*} callback is the callback for controller
     */
    login = (userLoginData, callback) => {
        var start = new Date();
        const userEmail = userLoginData.emailId;
        const key = "login";
        redisCache.redisGet(userEmail, key, (error, data) => {
            if (data) {
                const token = helper.createToken(data[0]);
                data.token = token;
                return callback(null, data);
            } else if (!data) {
                User.find(userLoginData, (error, data) => {
                    if (error) {
                        logger.error("ERR:500-Some error occured while logging in");
                        return callback(
                            new Error("ERR:500-Some error occured while logging in"),
                            null
                        );
                    } else if (data) {
                        bcrypt.compare(
                            userLoginData.password,
                            data[0].password,
                            (error, result) => {
                                if (result) {
                                    logger.info("Authorization success");

                                    const token = helper.createToken(data[0]);
                                    data.token = token;

                                    const redisData = redisCache.setRedis(data, userEmail, key);

                                    return callback(null, data);
                                } else {
                                    logger.info("ERR:401-Please verify email before login");
                                    return callback(
                                        new Error("ERR:401-Please verify email before login"),
                                        null
                                    );
                                }
                            }
                        );
                    }
                });
            }
        });
    };
    /**
     * @description Update greeting by id and return response to controller
     * @param {*} userInfo
     * @param {*} callback
     */
    forgotPassword = (userInfo, callback) => {
        User.findOne(userInfo, (error, data) => {
            if (error) {
                logger.error("Some error occurred");
                return callback(new Error("Some error occurred"), null);
            } else if (!data) {
                logger.error("User with this email Id dosent exist");
                return callback(
                    new Error("User with this email Id dosent exist"),
                    null
                );
            } else {
                const token = helper.createToken(data);
                userInfo.token = token;
                console.log(token);
                helper.emailSender(userInfo, (error, data) => {
                    console.log("userInfo" + userInfo);
                    if (error) {
                        logger.error("Some error occurred while sending email");
                        return callback(
                            new Error("Some error occurred while sending email"),
                            null
                        );
                    }
                    return callback(null, data);
                });
            }
        });
    };

    /**
     * @description Update user and return response to controller
     * @param {*} userInfo
     * @param {*} callback
     */
    resetPassword = (userInfo, callback) => {
        let decode = jwt.verify(userInfo.token, process.env.SECRET_KEY);
        let userId = decode.id;
        userInfo.userId = userId;
        User.update(userInfo, (error, data) => {
            if (error) return callback(error, null);
            else return callback(null, data);
        });
    };
}

module.exports = new userService();