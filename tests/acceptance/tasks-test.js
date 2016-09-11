import { test } from 'qunit';
import moduleForAcceptance from 'ember-todo/tests/helpers/module-for-acceptance';

moduleForAcceptance('Acceptance | Tasks');

test('visiting /tasks/new', function(assert) {
  visit('/tasks/new');

  andThen(function() {
    assert.equal(currentPath(), 'tasks.new');
  });
});

test('adding a new task', function(assert) {
  let day = server.create('day', { date: '2014-11-13' });
  assert.expect(2);

  server.post('/tasks', function(schema, request) {
    let params = JSON.parse(request.requestBody)['task'];
    assert.equal(params.day_id, day.id, 'makes request with the correct day ID');
    assert.equal(params.description, 'Something');

    return schema.tasks.create(this.normalizedRequestAttrs());
  });

  visit('/tasks/new');
  fillIn('.spec-new-task-description', 'Something');
  fillIn('.spec-new-task-date', '2014-11-13');
  click('.spec-create-task');
});

test('clicking "new task" link in header shows the "new task" form', function(assert) {
  visit('/');
  click('.top-nav .new-task');

  andThen(function() {
    assert.equal(currentPath(), 'tasks.new');
  });
});

test('redirects to /days after adding a new task', function(assert) {
  let day = server.create('day');

  server.post('/tasks');

  visit('/tasks/new');
  fillIn('.spec-new-task-description', 'A new task');
  fillIn('.spec-new-task-date', day.date);
  click('.spec-create-task');

  andThen(function() {
    assert.equal(currentPath(), 'days');
  });
});
