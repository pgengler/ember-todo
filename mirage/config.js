export default function() {
  this.passthrough('/write-coverage');

  this.namespace = '/api/v2';

  this.get('/lists', function({ lists }, request) {
    let matchingLists = lists.all();
    if (request.queryParams['filter[date]']) {
      let dates = request.queryParams['filter[date]'];
      dates.forEach((date) => {
        if (!lists.findBy({ name: date, listType: 'day' })) {
          lists.create({ name: date, listType: 'day' });
        }
      });
      matchingLists = lists.all().filter((list) => dates.includes(list.name));
    }
    if (request.queryParams['filter[list-type]']) {
      let listType = request.queryParams['filter[list-type]'];
      matchingLists = matchingLists.filter((list) => list.listType === listType);
    }
    return matchingLists;
  });
  this.get('/tasks');
  this.get('/tasks/:id');
}
