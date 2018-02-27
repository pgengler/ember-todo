import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import { click, currentRouteName, fillIn, findAll, triggerEvent, triggerKeyEvent, visit } from '@ember/test-helpers';
import dragAndDrop from 'ember-todo/tests/helpers/drag-and-drop';
import { authenticateSession } from 'ember-simple-auth/test-support';
import { Response } from 'ember-cli-mirage';

async function fillInAndPressEnter(selector, text) {
  await fillIn(selector, text);
  return triggerKeyEvent(selector, 'keyup', 13);
}

module('Acceptance | Days', function(hooks) {
  setupApplicationTest(hooks);
  hooks.beforeEach(() => authenticateSession());

  test('visiting /days', async function(assert) {
    server.create('list', {
      listType: 'day',
      name: '2014-11-06'
    });
    server.createList('list', 4, { listType: 'day' });
    server.create('list', { listType: 'list' });
    await visit('/days?date=2014-11-07');

    assert.equal(currentRouteName(), 'days');
    assert.dom('.task-list h1').hasText('Thursday');
    assert.dom('.task-list h2').hasText('Nov 6, 2014');
    assert.equal(findAll('.task-list').length, 6);
  });

  test('adding a new task sends right data to server', async function(assert) {
    let list = server.create('list', {
      listType: 'day',
      name: '2017-08-20'
    });
    assert.expect(3);

    server.post('/tasks', function({ tasks }, request) {
      let requestData = JSON.parse(request.requestBody).data;
      assert.equal(requestData.relationships.list.data.id, list.id, 'request includes correct list ID');
      assert.equal(requestData.attributes.description, 'A new task', 'request includes correct description');

      return tasks.create(this.normalizedRequestAttrs());
    });

    await visit('/days?date=2017-08-20');
    await fillInAndPressEnter('.task-list[data-test-list-name="2017-08-20"] .spec-new-task', 'A new task');

    assert.dom('.spec-task').hasText('A new task');
  });

  test('pressing Escape clears textarea for new tasks', async function(assert) {
    server.create('list', { type: 'date' });
    await visit('/days');

    await fillIn('.spec-new-task', 'New task');
    await triggerKeyEvent('.spec-new-task', 'keyup', 27);

    assert.dom('.spec-new-task').hasValue('', 'textarea is cleared after pressing Escape');
  });

  test('dragging a task to another day', async function(assert) {
    assert.expect(3);

    let task = server.create('task');
    server.create('list', {
      listType: 'day',
      name: '2016-03-07',
      taskIds: [ task.id ]
    });
    let targetDay = server.create('list', {
      listType: 'day',
      name: '2016-03-08'
    });

    server.patch('/tasks/:id', function({ tasks }, request) {
      let requestData = JSON.parse(request.requestBody).data;
      assert.equal(requestData.relationships.list.data.id, targetDay.id, 'makes PATCH request with new list ID');

      let task = tasks.find(request.params.id);
      task.update(this.normalizedRequestAttrs());
      return task;
    });

    await visit('/days?date=2016-03-07');

    await dragAndDrop('.spec-task', '.task-list[data-test-list-name="2016-03-08"]');

    assert.equal(findAll('.task-list[data-test-list-name="2016-03-07"] .spec-task').length, 0, 'task is no longer displays under original day');
    assert.equal(findAll('.task-list[data-test-list-name="2016-03-08"] .spec-task').length, 1, 'task is displayed under new day');
  });

  test('dragging and dropping a task with Control held copies a task', async function(assert) {
    assert.expect(3);

    let task = server.create('task');
    server.create('list', {
      listType: 'day',
      name: '2016-03-07',
      taskIds: [ task.id ]
    });
    let targetDay = server.create('list', {
      listType: 'day',
      name: '2016-03-08'
    });

    server.post('/tasks', function({ tasks }, request) {
      let requestData = JSON.parse(request.requestBody).data;
      assert.ok(true, 'makes POST request to create new task');
      assert.equal(requestData.attributes.description, task.description, 'creates new task with same description');
      assert.equal(requestData.relationships.list.data.id, targetDay.id, 'creates new task on the correct day');

      return tasks.create(this.normalizedRequestAttrs());
    });

    await visit('/days?date=2016-03-07');
    await dragAndDrop('.spec-task', '.task-list[data-test-list-name="2016-03-08"]', { ctrlKey: true });
  });

  test('updating the description for a task', async function(assert) {
    assert.expect(3);
    let task = server.create('task', { description: "I'm a task" });
    server.create('list', {
      listType: 'day',
      name: '2016-03-07',
      taskIds: [ task.id ]
    });

    server.patch('/tasks/:id', function({ tasks }, request) {
      let requestData = JSON.parse(request.requestBody).data;

      assert.ok(true, 'makes a PATCH request');
      assert.equal(request.params.id, task.id, 'makes a PUT request for the correct task');
      assert.equal(requestData.attributes.description, 'New description', 'sends the new description in the request');

      let matchingTask = tasks.find(request.params.id);
      matchingTask.update(this.normalizedRequestAttrs());
      return matchingTask;
    });

    await visit('/days?date=2016-03-07');
    await triggerEvent('.spec-task', 'dblclick');
    await fillInAndPressEnter('.spec-task textarea', 'New description');
  });

  test('setting an empty description for a task deletes it', async function(assert) {
    assert.expect(2);
    let task = server.create('task');
    server.create('list', {
      listType: 'day',
      name: '2016-03-07',
      taskIds: [ task.id ]
    });

    server.delete('/tasks/:id', function(db, request) {
      assert.ok(true, 'makes a DELETE request');
      assert.equal(request.params.id, task.id, 'makes a DELETE request for the right ID');
    });

    await visit('/days?date=2016-03-07');
    await triggerEvent('.spec-task', 'dblclick');
    await fillInAndPressEnter('.spec-task textarea', '');
  });

  test('newly-created-but-still-saving tasks appear in the "pending" state', async function(assert) {
    assert.expect(5);

    server.post('/tasks', function(schema) {
      assert.equal(findAll('.spec-task').length, 1, 'displays the new task');
      assert.dom('.spec-task.pending').exists('new task gets the "pending" CSS class');
      assert.dom('.spec-new-task').hasValue('', '"new task" textarea is cleared');

      return schema.tasks.create(this.normalizedRequestAttrs());
    });

    await visit('/days');
    await fillInAndPressEnter('.spec-new-task', 'new thing');

    assert.equal(findAll('.spec-task').length, 1, 'still only displays one item after save finishes');
    assert.dom('.spec-task.pending').doesNotExist('"pending" CSS class is no longer applied');
  });

  test('clicking a date column header focuses the "add new task" for it', async function(assert) {
    await visit('/days');
    await click('.task-list h1');

    assert.dom('.spec-new-task').isFocused();
  });

  test('tasks are resorted correctly when editing descriptions', async function(assert) {
    let list = server.create('list', {
      listType: 'day',
      name: '2018-01-01'
    });
    server.create('task', { description: 'xyz', list });
    server.create('task', { description: 'abc', list });
    server.create('task', { description: 'mno', list });

    server.patch('/tasks/:id', function({ tasks }, request) {
      let matchingTask = tasks.find(request.params.id);
      matchingTask.update(this.normalizedRequestAttrs());
      return matchingTask;
    });

    await visit('/days?date=2018-01-01');

    let displayedTasks = findAll('.spec-task').map((element) => element.textContent.trim());
    assert.deepEqual(displayedTasks, [ 'abc', 'mno', 'xyz' ], 'tasks are displayed in alphabetical order');

    await triggerEvent(findAll('.spec-task')[1], 'dblclick');
    await fillInAndPressEnter(findAll('.spec-task')[1].querySelector('textarea'), 'zzz');

    displayedTasks = findAll('.spec-task').map((element) => element.textContent.trim());
    assert.deepEqual(displayedTasks, [ 'abc', 'xyz', 'zzz' ], 'after editing a task, alphabetical order is preserved');
  });

  test('handles when adding a task fails', async function(assert) {
    server.create('list', { listType: 'list', name: 'Other' });

    server.post('/tasks', function() {
      return new Response(500, { }, {
        errors: [
          {
            status: 500,
            detail: 'Something went wrong'
          }
        ]
      });
    });
    await visit('/days?date=2018-01-01');
    await fillInAndPressEnter('.task-list[data-test-list-name="Other"] .spec-new-task', 'This will fail');

    assert.dom('.flash-message.alert').exists('an error message is displayed');
    assert.dom('.task.error').exists('task is displayed with the "error" class');
  });
});
