import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, triggerEvent } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import EmberObject from '@ember/object';

module('Integration | Component | single-task', function(hooks) {
  setupRenderingTest(hooks);

  test('displays a regular task', async function(assert) {
    this.set('task', EmberObject.create({
      description: 'foo'
    }));
    await render(hbs`{{single-task task=task}}`);

    assert.dom('input[type=checkbox]').exists('displays a checkbox');
    assert.dom('.task').hasText('foo', 'displays task description');
  });

  test('displays a pending task', async function(assert) {
    this.set('task', EmberObject.create({
      isNew: true,
      description: 'bar'
    }));
    await render(hbs`{{single-task task=task}}`);

    assert.dom('input[type=checkbox]').doesNotExist('does not show a checkbox for pending tasks');
    assert.dom('.fa-spinner').exists('shows a spinner');
    assert.dom('.task').hasClass('pending', 'pending tasks get the "pending" class');
    assert.dom('.task').hasText('bar', 'displays task description');
  });

  test('displays a task that failed to save', async function(assert) {
    this.set('task', EmberObject.create({
      isError: true,
      description: 'baz'
    }));
    await render(hbs`{{single-task task=task}}`);

    assert.dom('input[type=checkbox]').doesNotExist('does not show a checkbox');
    assert.dom('.fa-warning').exists('shows the right icon');
    assert.dom('.fa-warning').hasAttribute('title', 'Task failed to save');
    assert.dom('.task').hasClass('error', 'failed saves get the "error" class');
    assert.dom('.task').hasText('baz', 'displays task description');
  });

  test('double-clicking a task enters edit mode', async function(assert) {
    this.set('task', EmberObject.create({
      description: 'foo bar'
    }));
    await render(hbs`{{single-task task=task}}`);
    await triggerEvent('.task', 'dblclick');

    assert.dom('input[type=checkbox]').doesNotExist('checkbox is no longer displayed');
    assert.dom('textarea').exists('displays a textarea for editing');
    assert.dom('textarea').hasValue('foo bar', 'textarea is prepopulated with the current description');
  });
});
