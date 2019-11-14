async function getQuery(query, options) {
  const docsQuery = this.find(query)
    .select(options.select)
    .sort(options.sort)
    .skip(options.skip)
    .limit(options.limit);

  if (options.populate) {
    [].concat(options.populate).forEach(item => {
      docsQuery.populate(item);
    });
  }

  return docsQuery;
}

async function getAggregateQuery(query, options) {
  return this.aggregate([
    ...query,
    { $sort: options.sort },
    { $skip: options.skip },
    { $limit: options.limit }
  ]);
}

async function getCount(query) {
  return this.count(query);
}

async function getAggregateCount(query) {
  const countResponse = await this.aggregate([...query, { $count: "count" }]);

  return countResponse[0].count;
}

async function paginate(query = {}, options = {}, isAggregation = false) {
  if (!options.sort) {
    options.sort = { _id: 1 };
  }

  if (!options.limit) {
    options.limit = 10;
  }

  if (options.page) {
    options.skip = (options.page - 1) * options.limit;
  } else {
    options.page = 1;
    options.skip = 0;
  }

  const data = {
    docs: !isAggregation
      ? await getQuery.call(this, query, options)
      : await getAggregateQuery.call(this, query, options)
  };

  if (!options.noPaging) {
    data.count = !isAggregation
      ? await getCount.call(this, query)
      : await getAggregateCount.call(this, query);
  }

  const result = {
    docs: data.docs.map(doc => ({ ...doc, id: String(doc._id) })),
    limit: options.limit,
    page: options.page
  };

  if (!options.noPaging) {
    result.total = data.count;
    result.pages = Math.ceil(data.count / options.limit) || 1;
  }

  return result;
}

module.exports = function(schema) {
  schema.statics.paginate = paginate;
};

module.exports.paginate = paginate;
