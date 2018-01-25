import { next } from '@ember/runloop';
import { computed } from '@ember/object';
import { filterBy, notEmpty } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { compare } from '@ember/utils';
import Component from '@ember/component';
import DraggableDropzone from '../mixins/draggable-dropzone';

function plaintext(str) {
  return str.replace(/[^A-Za-z0-9]/g, '');
}

export default Component.extend(DraggableDropzone, {
  classNames: [ 'task-list' ],
  classNameBindings: [ 'hasUnfinishedTasks', 'dragClass' ],
  headerComponent: 'task-list/header',
  newTaskDescription: '',
  dragClass: '',

  flashMessages: service(),
  store: service(),

  sortedTasks: computed('list.tasks.@each.description', function() {
    return this.get('list.tasks').toArray().sort(function(a, b) {
      return compare(plaintext(a.get('description')), plaintext(b.get('description')));
    });
  }),
  sortedFinishedTasks: filterBy('sortedTasks', 'done', true),
  sortedUnfinishedTasks: filterBy('sortedTasks', 'done', false),
  sortedPendingTasks: filterBy('sortedTasks', 'isNew', true),

  hasUnfinishedTasks: notEmpty('sortedUnfinishedTasks'),

  didInsertElement() {
    this.$('.task-list-header').on('click', () => this.$('.new-task').focus());
  },

  willDestroyElement() {
    this.$('.task-list-header').off('click');
  },

  cloneTask(task) {
    let newTask = this.store.createRecord('task', {
      list: this.get('list'),
      description: task.get('description')
    });
    newTask.save();
  },
  moveTaskToList(task) {
    task.set('list', this.get('list'));
    task.save();
  },

  actions: {
    addTask() {
      let description = this.get('newTaskDescription').trim();
      if (!description) {
        return;
      }
      let list = this.get('list');
      let task = this.get('store').createRecord('task', { description, list });
      list.get('tasks').addObject(task);

      next(() => {
        task.save()
          .then(() => this.set('newTaskDescription', ''))
          .catch((err) => this.get('flashMessages').error(err));
      });
    },

    clearTextarea() {
      this.set('newTaskDescription', '');
    },

    dropped(id, event) {
      let cloningTask = event.ctrlKey ? true : false;

      this.set('dragClass', '');

      this.store.findRecord('task', id).then((task) => cloningTask ? this.cloneTask(task) : this.moveTaskToList(task));
    },

    dragIn() {
      this.set('dragClass', 'active-drop-target');
    },
    dragOut() {
      this.set('dragClass', '');
    }
  }
});
