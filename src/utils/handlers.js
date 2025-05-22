exports.handlers = {
  logger: {
    success: ({
      objectType,
      code = 200,
      status = true,
      message,
      data = null,
    }) => {
      return console.log({ objectType, code, status, message, data });
    },
    info: ({
      objectType,
      code = 201,
      status = false,
      message,
      data = null,
    }) => {
      return console.info({ objectType, code, status, message, data });
    },
    error: ({
      objectType,
      code = 400,
      status = false,
      message,
      data = null,
    }) => {
      return console.error({ objectType, code, status, message, data });
    },
    unauthorized: ({
      objectType,
      code = 401,
      status = false,
      message,
      data = null,
    }) => {
      return console.error({ objectType, code, status, message, data });
    },
    unavailable: ({
      objectType,
      code = 404,
      status = false,
      message,
      data = null,
    }) => {
      return console.error({ objectType, code, status, message, data });
    },
    failed: ({
      objectType,
      code = 500,
      status = false,
      message,
      data = null,
    }) => {
      return console.error({ objectType, code, status, message, data });
    },
  },
  response: {
    success: ({ res, code = 200, status = true, message, data }) => {
      return res.status(code).json({
        code,
        status,
        message,
        data,
      });
    },
    error: ({ res, code = 400, status = false, message, data }) => {
      return res.status(code).json({
        code,
        status,
        message,
        data,
      });
    },
    unauthorized: ({ res, code = 401, status = false, message, data }) => {
      return res.status(code).json({
        code,
        status,
        message,
        data,
      });
    },
    unavailable: ({ res, code = 404, status = false, message, data }) => {
      return res.status(code).json({
        code,
        status,
        message,
        data,
      });
    },
    failed: ({ res, code = 500, status = false, message, data }) => {
      return res.status(code).json({
        code,
        status,
        message,
        data,
      });
    },
  },
};
