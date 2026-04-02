import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import chatroomService from "./chatroom.service";

const sendMessage = catchAsync(async (req, res) => {
  // console.log("req", req);
  const result = await chatroomService.sendMessage(req);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Message sent successfully",
    data: result,
  });
});

const getAllMessages = catchAsync(async (req, res) => {
  const { data, meta } = await chatroomService.getAllMessages(req);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Messages retrieved successfully",
    data,
    meta,
  });
});

const getPinnedMessages = catchAsync(async (_req, res) => {
  const result = await chatroomService.getPinnedMessages();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Pinned messages retrieved successfully",
    data: result,
  });
});

const getRepliesToMe = catchAsync(async (req, res) => {
  const { data, meta } = await chatroomService.getRepliesToMe(req);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Replies retrieved successfully",
    data,
    meta,
  });
});

const togglePinMessage = catchAsync(async (req, res) => {
  const result = await chatroomService.togglePinMessage(req);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `Message ${result.isPinned ? "pinned" : "unpinned"} successfully`,
    data: result,
  });
});

const reactToMessage = catchAsync(async (req, res) => {
  const result = await chatroomService.reactToMessage(req);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Reaction updated successfully",
    data: result,
  });
});

const deleteMessage = catchAsync(async (req, res) => {
  await chatroomService.deleteMessage(req);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Message deleted successfully",
  });
});

export const chatroomController = {
  sendMessage,
  getAllMessages,
  getPinnedMessages,
  getRepliesToMe,
  togglePinMessage,
  reactToMessage,
  deleteMessage,
};
