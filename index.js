'use strict';

/**
 * @package mongoose-paginate
 * @param {Object} [query={}]
 * @param {Object} [options={}]
 * @param {Object|String} [options.select]
 * @param {Object|String} [options.sort]
 * @param {Array|Object|String} [options.populate]
 * @param {Boolean} [options.lean=false]
 * @param {Boolean} [options.leanWithId=true]
 * @param {Number} [options.offset=0] - Use offset or page to set skip position
 * @param {Number} [options.page=1]
 * @param {Number} [options.limit=10]
 * @param {Number} [options.noPaging=false]
 * @param {Function} [callback]
 * @returns {Promise}
 */

async function paginate(query, options, callback) {
  query = query || {};
  options = Object.assign({}, paginate.options, options);
  let select = options.select;
  let sort = options.sort;
  let populate = options.populate;
  let lean = options.lean || false;
  let leanWithId = options.leanWithId ? options.leanWithId : true;
  let limit = options.limit ? options.limit : 10;
  let noPaging = options.noPaging || false 
  let page, offset, skip, data;

  if (options.offset) {
    offset = options.offset;
    skip = offset;
  } else if (options.page) {
    page = options.page;
    skip = (page - 1) * limit;
  } else {
    page = 1;
    offset = 0;
    skip = offset;
  }

  let docsQuery = this.find(query)
    .select(select)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean(lean);

  if (populate) {
    [].concat(populate).forEach((item) => {
      docsQuery.populate(item);
    });
  }
  data = {
    docs: await docsQuery.exec(),
  };

  if (noPaging === false) {
    data.count = await this.count(query).exec();
  }

  if (lean && leanWithId) {
    data.docs.forEach((doc) => {
        doc.id = String(doc._id);
    });
  }

  let result = {
    docs: data.docs,
    limit: limit
  };

  if (offset !== undefined) {
    result.offset = offset;
  }

  if (page !== undefined) {
    result.page = page;

    if (noPaging === false) {
      result.total = data.count,
      result.pages = Math.ceil(data.count / limit) || 1;
    }
  }

  return result;
}

/**
 * @param {Schema} schema
 */

module.exports = function(schema) {
  schema.statics.paginate = paginate;
};

module.exports.paginate = paginate;
