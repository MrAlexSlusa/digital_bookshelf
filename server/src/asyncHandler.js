// Express 4 does not catch rejected promises from async route handlers,
// which otherwise become unhandled rejections and can crash the process.
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
