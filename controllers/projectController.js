const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");

exports.getApartmentByName = asyncHandler(async (req, res, next) => {
  const { name } = req.params;

  if (!name) {
    return next(new ApiError("يجب إرسال اسم الشقة في الـ query", 400));
  }

  const project = await mongoose.connection.db.collection("Project").findOne({
    "blocks.buildings.floors.apartments.name": name,
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
          if (apartment.name === name) {
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
  const { status } = req.body;

  const allowedStatuses = ["available", "sold", "not_offered", "reserved"];

  if (!name) {
    return next(new ApiError("يجب إرسال اسم الشقة في الـ query", 400));
  }

  if (!status || !allowedStatuses.includes(status)) {
    return next(new ApiError("الحالة المرسلة غير صحيحة", 400));
  }

  // نجيب المشروع اللي فيه الشقة
  const project = await mongoose.connection.db.collection("Project").findOne({
    "blocks.buildings.floors.apartments.name": name,
  });

  if (!project) {
    return next(new ApiError("الشقة غير موجودة", 404));
  }

  let newStatus = null;
  project.blocks.forEach((block) => {
    block.buildings.forEach((building) => {
      building.floors.forEach((floor) => {
        floor.apartments.forEach((apartment) => {
          if (apartment.name === name) {
            apartment.status = status; // نخليها زي اللي جاي من الـ body
            newStatus = status;
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

exports.getApartmentsStats = asyncHandler(async (req, res, next) => {
  const stats = await mongoose.connection.db
    .collection("Project")
    .aggregate([
      { $unwind: "$blocks" },
      { $unwind: "$blocks.buildings" },
      { $unwind: "$blocks.buildings.floors" },
      { $unwind: "$blocks.buildings.floors.apartments" },
      {
        $group: {
          _id: "$blocks.buildings.floors.apartments.status",
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();

  const formattedStats = {
    available: 0,
    sold: 0,
    not_offered: 0,
    reserved: 0,
  };

  stats.forEach((s) => {
    if (formattedStats[s._id] !== undefined) {
      formattedStats[s._id] = s.count;
    }
  });

  res.status(200).json({
    status: "success",
    stats: formattedStats,
    total: Object.values(formattedStats).reduce((a, b) => a + b, 0),
  });
});

exports.getProjectDataWithStats = asyncHandler(async (req, res, next) => {
  const { block, build, floor, apartment } = req.params;

  const project = await mongoose.connection.db
    .collection("Project")
    .findOne({});

  if (!project) {
    return next(new ApiError(`لا يوجد أي مشروع حالياً`, 404));
  }

  let result = project; // افتراضياً كل المشروع

  // لو فيه بلوك محدد
  if (block) {
    const blockData = project.blocks.find((b) => b.name === block);
    if (!blockData) {
      return next(new ApiError(`لا يوجد بلوك بإسم ${block}`, 404));
    }
    result = blockData;

    if (build) {
      const buildData = blockData.buildings.find((b) => b.name === build);
      if (!buildData) {
        return next(
          new ApiError(`لا يوجد مبنى بإسم ${build} داخل البلوك ${block}`, 404)
        );
      }
      result = buildData;
    }

    if (floor) {
      const floorData = result.floors.find(
        (f) => f.floorNumber.toLowerCase() === floor.toLowerCase()
      );
      if (!floorData) {
        return next(
          new ApiError(`لا يوجد دور بإسم ${floor} داخل المبنى ${build}`, 404)
        );
      }
      result = floorData;
    }

    if (apartment) {
      const apartmentData = result.apartments.find((a) => a.name === apartment);
      if (!apartmentData) {
        return next(
          new ApiError(
            `لا يوجد وحدة بإسم ${apartment} داخل الدور ${floor}`,
            404
          )
        );
      }
      result = apartmentData;
    }
  }

  // حساب الإحصائيات بناءً على المستوى الحالي
  let apartmentsList = [];

  if (result.apartments) {
    apartmentsList = result.apartments;
  } else if (result.floors) {
    apartmentsList = result.floors.flatMap((f) => f.apartments);
  } else if (result.buildings) {
    apartmentsList = result.buildings.flatMap((b) =>
      b.floors.flatMap((f) => f.apartments)
    );
  } else if (result.blocks) {
    apartmentsList = result.blocks.flatMap((bl) =>
      bl.buildings.flatMap((b) => b.floors.flatMap((f) => f.apartments))
    );
  }

  const formattedStats = {
    available: 0,
    sold: 0,
    not_offered: 0,
    reserved: 0,
  };

  apartmentsList.forEach((a) => {
    if (formattedStats[a.status] !== undefined) {
      formattedStats[a.status]++;
    }
  });

  res.status(200).json({
    status: "success",
    data: result,
    stats: formattedStats,
    total: apartmentsList.length,
  });
});

exports.getApartmentsByStatus = asyncHandler(async (req, res, next) => {
  const { block, build, floor, apartment } = req.params;
  const { status } = req.body;

  if (!status) {
    return next(new ApiError("برجاء إرسال الحالة المطلوبة في الـ body", 400));
  }

  const project = await mongoose.connection.db
    .collection("Project")
    .findOne({});

  if (!project) {
    return next(new ApiError(`لا يوجد أي مشروع حالياً`, 404));
  }

  let result = project;

  // التصفية التدريجية للمستوى المطلوب
  if (block) {
    const blockData = project.blocks.find((b) => b.name === block);
    if (!blockData) {
      return next(new ApiError(`لا يوجد بلوك بإسم ${block}`, 404));
    }
    result = blockData;

    if (build) {
      const buildData = blockData.buildings.find((b) => b.name === build);
      if (!buildData) {
        return next(
          new ApiError(`لا يوجد مبنى بإسم ${build} داخل البلوك ${block}`, 404)
        );
      }
      result = buildData;
    }

    if (floor) {
      const floorData = result.floors.find(
        (f) => f.floorNumber.toLowerCase() === floor.toLowerCase()
      );
      if (!floorData) {
        return next(
          new ApiError(`لا يوجد دور بإسم ${floor} داخل المبنى ${build}`, 404)
        );
      }
      result = floorData;
    }

    if (apartment) {
      const apartmentData = result.apartments.find((a) => a.name === apartment);
      if (!apartmentData) {
        return next(
          new ApiError(
            `لا يوجد وحدة بإسم ${apartment} داخل الدور ${floor}`,
            404
          )
        );
      }
      result = apartmentData;
    }
  }

  // دالة لإعادة بناء الهيكل مع فلترة الشقق حسب الحالة
  function filterHierarchyByStatus(level) {
    // إذا كان المستوى شقة
    if (level.status !== undefined) {
      return level.status === status ? level : null;
    }

    // إذا كان فيه شقق مباشرة
    if (level.apartments) {
      const filteredApts = level.apartments.filter((a) => a.status === status);
      return { ...level, apartments: filteredApts };
    }

    // إذا كان فيه أدوار
    if (level.floors) {
      const filteredFloors = level.floors
        .map(filterHierarchyByStatus)
        .filter((f) => f && f.apartments.length > 0);
      return { ...level, floors: filteredFloors };
    }

    // إذا كان فيه مباني
    if (level.buildings) {
      const filteredBuildings = level.buildings
        .map(filterHierarchyByStatus)
        .filter((b) => b && b.floors.length > 0);
      return { ...level, buildings: filteredBuildings };
    }

    // إذا كان فيه بلوكات
    if (level.blocks) {
      const filteredBlocks = level.blocks
        .map(filterHierarchyByStatus)
        .filter((bl) => bl && bl.buildings.length > 0);
      return { ...level, blocks: filteredBlocks };
    }

    return level;
  }

  const filteredResult = filterHierarchyByStatus(result);

  res.status(200).json({
    status: "success",
    data: filteredResult,
  });
});

exports.ChangeApartmentPrice = asyncHandler(async (req, res, next) => {
  const { name } = req.params;
  const { price } = req.body;

  if (!name) {
    return next(new ApiError("يجب إرسال اسم الشقة في الـ query", 400));
  }

  if (!price) {
    return next(new ApiError("السعر مطلوب", 400));
  }

  // نجيب المشروع اللي فيه الشقة
  const project = await mongoose.connection.db.collection("Project").findOne({
    "blocks.buildings.floors.apartments.name": name,
  });

  if (!project) {
    return next(new ApiError("الشقة غير موجودة", 404));
  }

  let newPrice = null;
  project.blocks.forEach((block) => {
    block.buildings.forEach((building) => {
      building.floors.forEach((floor) => {
        floor.apartments.forEach((apartment) => {
          if (apartment.name === name) {
            apartment.price = price;
            newPrice = price;
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
    message: `تم تعديل حالة الشقة (${name}) إلى: ${newPrice}`,
    apartmentId: name,
    newPrice,
  });
});
