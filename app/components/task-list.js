import { filterBy, notEmpty, sort } from '@ember/object/computed';
import { next } from '@ember/runloop';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import DraggableDropzone from '../mixins/draggable-dropzone';

const taskSorting = [ 'plaintextDescription' ];

export default Component.extend(DraggableDropzone, {
  attributeBindings: [ 'list.name:data-test-list-name' ],
  classNames: [ 'task-list' ],
  classNameBindings: [ 'hasUnfinishedTasks', 'dragClass' ],

  dragClass: '',
  headerComponent: 'task-list/header',
  newTaskDescription: '',
  taskSorting,

  editingStart() { /* noop */ },
  editingEnd() { /* noop */ },

  flashMessages: service(),
  store: service(),

  finishedTasks: filterBy('list.tasks', 'done', true),
  unfinishedTasks: filterBy('list.tasks', 'done', false),
  pendingTasks: filterBy('list.tasks', 'isNew'),

  sortedFinishedTasks: sort('finishedTasks', 'taskSorting'),
  sortedUnfinishedTasks: sort('unfinishedTasks', 'taskSorting'),
  sortedPendingTasks: sort('pendingTasks', 'taskSorting'),

  hasUnfinishedTasks: notEmpty('unfinishedTasks'),

  didInsertElement() {
    this.$('.task-list-header').on('click', () => this.$('.new-task').focus());
  },

  willDestroyElement() {
    this.$('.task-list-header').off('click');
  },

  cloneTask(task) {
    let newTask = this.get('store').createRecord('task', {
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
      let task = this.get('store').createRecord('task', {
        description,
        list
      });

      this.set('newTaskDescription', '');

      next(() => {
        task.save()
          .catch((err) => this.get('flashMessages').error(err));
      });
    },

    clearTextarea() {
      this.set('newTaskDescription', '');
    },

    dropped(id, event) {
      let cloningTask = event.ctrlKey ? true : false;

      this.set('dragClass', '');

      this.get('store').findRecord('task', id).then((task) => cloningTask ? this.cloneTask(task) : this.moveTaskToList(task));
    },

    dragIn() {
      this.set('dragClass', 'active-drop-target');
    },
    dragOut() {
      this.set('dragClass', '');
    }
  }
});
