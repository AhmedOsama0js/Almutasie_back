const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");

exports.getAllProjects = asyncHandler(async (req, res, next) => {
  const projects = await mongoose.connection.db
    .collection("Project")
    .find({})
    .toArray();

  if (!projects || projects.length === 0) {
    return next(new ApiError("لا يوجد أي مشاريع حالياً", 404));
  }

  res.status(200).json({
    status: "success",
    results: projects.length,
    data: projects,
  });
});

exports.getApartmentByName = asyncHandler(async (req, res, next) => {
  const { name } = req.params;

  if (!name) {
    return next(new ApiError("يجب إرسال اسم الشقة في الـ query", 400));
  }

  const project = await mongoose.connection.db.collection("Project").findOne({
    "blocks.buildings.floors.apartments.id": name,
  });

  if (!project) {
    return next(new ApiError("الشقة غير موجودة", 404));
  }

  // نعمل Loop للوصول للشقة
  let foundApartment = null;
  project.blocks.forEach((block) => {
    block.buildings.forEach((building) => {
      building.floors.forEach((floor) => {
        floor.apartments.forEach((apartment) => {
          if (apartment.id === name) {
            foundApartment = {
              block: block.name,
              building: building.name,
              floor: floor.floorNumber,
              ...apartment,
            };
          }
        });
      });
    });
  });

  if (!foundApartment) {
    return next(new ApiError("الشقة غير موجودة", 404));
  }

  res.status(200).json({
    status: "success",
    data: foundApartment,
  });
});

exports.toggleApartmentStatus = asyncHandler(async (req, res, next) => {
  const { name } = req.params;

  if (!name) {
    return next(new ApiError("يجب إرسال اسم الشقة في الـ query", 400));
  }

  // نجيب المشروع اللي فيه الشقة
  const project = await mongoose.connection.db.collection("Project").findOne({
    "blocks.buildings.floors.apartments.id": name,
  });

  if (!project) {
    return next(new ApiError("الشقة غير موجودة", 404));
  }

  // نعدل حالة الشقة
  let newStatus = null;
  project.blocks.forEach((block) => {
    block.buildings.forEach((building) => {
      building.floors.forEach((floor) => {
        floor.apartments.forEach((apartment) => {
          if (apartment.id === name) {
            apartment.status =
              apartment.status === "available" ? "sold" : "available";
            newStatus = apartment.status;
          }
        });
      });
    });
  });

  // حفظ التعديل
  await mongoose.connection.db
    .collection("Project")
    .updateOne({ _id: project._id }, { $set: { blocks: project.blocks } });

  res.status(200).json({
    status: "success",
    message: `تم تعديل حالة الشقة (${name}) إلى: ${newStatus}`,
    apartmentId: name,
    newStatus,
  });
});
