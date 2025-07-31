// // utils/ApiFetcher.js
// class ApiFetcher {
//   constructor(query, queryString) {
//     this.query = query; // Mongoose Query
//     this.queryString = queryString; // req.query
//   }

//   filter() {
//     const queryObj = { ...this.queryString };
//     const excludeFields = ["page", "sort", "limit", "keyword"];
//     excludeFields.forEach((field) => delete queryObj[field]);

//     // دعم gte و lte وغيره
//     let queryStr = JSON.stringify(queryObj);
//     queryStr = queryStr.replace(
//       /\b(gte|gt|lte|lt|ne|in|nin)\b/g,
//       (match) => `$${match}`
//     );

//     const filters = JSON.parse(queryStr);

//     this.query = this.query.find({
//       ...this.query.getQuery(),
//       ...filters,
//     });

//     return this;
//   }

//   search(fields = []) {
//     const keyword = this.queryString.keyword;
//     if (keyword && fields.length > 0) {
//       const orConditions = fields.map((field) => ({
//         [field]: { $regex: keyword, $options: "i" },
//       }));

//       this.query = this.query.find({
//         ...this.query.getQuery(),
//         $or: orConditions,
//       });
//     }

//     return this;
//   }

//   sort() {
//     if (this.queryString.sort) {
//       const sortBy = this.queryString.sort.split(",").join(" ");
//       this.query = this.query.sort(sortBy);
//     } else {
//       this.query = this.query.sort("-createdAt");
//     }

//     return this;
//   }

//   paginate() {
//     const page = parseInt(this.queryString.page, 10) || 1;
//     const limit = parseInt(this.queryString.limit, 10) || 10;
//     const skip = (page - 1) * limit;

//     this.query = this.query.skip(skip).limit(limit);

//     return this;
//   }

//   getFinalQuery() {
//     return this.query;
//   }

//   getConditionsOnly() {
//     return this.query.getQuery();
//   }
// }

// module.exports = ApiFetcher;

class ApiFeatures {
  constructor(collection, queryString) {
    this.collection = collection; // MongoDB collection
    this.queryString = queryString; // req.query
    this.pipeline = []; // Aggregation pipeline
  }

  // 📌 البحث على جميع المستويات
  search() {
    if (this.queryString.keyword) {
      const regex = new RegExp(this.queryString.keyword, "i");

      this.pipeline.push(
        { $unwind: "$blocks" },
        { $unwind: "$blocks.buildings" },
        { $unwind: "$blocks.buildings.floors" },
        { $unwind: "$blocks.buildings.floors.apartments" },
        {
          $match: {
            $or: [
              { name: regex }, // project name
              { "blocks.name": regex }, // block name
              { "blocks.buildings.name": regex }, // building name
              { "blocks.buildings.floors.floorNumber": regex }, // floor number
              { "blocks.buildings.floors.apartments.id": regex }, // apartment id
              { "blocks.buildings.floors.apartments.number": regex }, // apartment number
            ],
          },
        }
      );
    }
    return this;
  }

  // 📌 الفلترة
  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "keyword"];
    excludedFields.forEach((el) => delete queryObj[el]);

    if (Object.keys(queryObj).length > 0) {
      this.pipeline.push({ $match: queryObj });
    }
    return this;
  }

  // 📌 الترتيب
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      const sortObj = {};
      sortBy.split(" ").forEach((field) => {
        if (field.startsWith("-")) {
          sortObj[field.substring(1)] = -1; // descending
        } else {
          sortObj[field] = 1; // ascending
        }
      });
      this.pipeline.push({ $sort: sortObj });
    } else {
      this.pipeline.push({ $sort: { createdAt: -1 } }); // default newest first
    }
    return this;
  }

  // 📌 التنفيذ
  async exec() {
    return await this.collection.aggregate(this.pipeline).toArray();
  }
}

module.exports = ApiFeatures;
