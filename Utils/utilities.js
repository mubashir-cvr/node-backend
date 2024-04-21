/**
 * Process a list (array) of numbers.
 * @param {Object} data 
 * @param {number} statusCode 
 * @param {string} userMessage 
 */
const errorResponse=(statusCode,userMessage,data)=>{
    const error = new Error(userMessage);
    error.statusCode = statusCode;
    error.data = data
    return error;
}

/**
 * Process a list (array) of numbers.
 * @param {Object} data 
 * @param {number} statusCode 
 * @param {string} userMessage 
 * @param {object} extra 
 */
const generateResponse=(statusCode,userMessage,data,extra)=>{
    let response ={
        statusCode:statusCode,
        message: userMessage || "success",
        data:data,
        extra:extra
      }

      return response;
}

module.exports = {
    errorResponse,generateResponse
  };
  