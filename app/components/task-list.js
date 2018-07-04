import { filterBy, notEmpty, sort } from '@ember/object/computed';
import { next } from '@ember/runloop';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import DraggableDropzone from '../mixins/draggable-dropzone';
import Sortable from 'sortablejs';

const taskSorting = [ 'sortOrder' ];

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
    let sortable = Sortable.create(this.element.querySelector('ul'), {
      draggable: '.draggable',
      setData: (dataTransfer, element) => {
        dataTransfer.setData('text/data', element.dataset.taskId);
      },
      onEnd: (evt) => {
        console.log('onEnd, event: %O', evt);
        let element = evt.item;
        let task = this.get('list.tasks').find((task) => task.get('id') === element.dataset.taskId);
        let otherTasks = this.get('list.tasks').filter((task) => task.get('id') !== element.dataset.taskId);

        let { oldIndex, newIndex } = evt;
        let oldPosition = oldIndex + 1;
        let newPosition = newIndex + 1;

        console.log('moving task "%s" from %d to %d', task.get('description'), oldPosition, newPosition);

        if (oldPosition === newPosition) return;

        if (oldPosition > newPosition) {
          // moving toward the front of the list
          otherTasks.filter((task) => task.get('sortOrder') >= oldPosition).forEach((task) => task.decrementProperty('sortOrder'));
          otherTasks.filter((task) => task.get('sortOrder') > newPosition).forEach((task) => task.incrementProperty('sortOrder'));
        } else {
          // moving toward the back of the list
          newPosition--;
          otherTasks.filter((task) => task.get('sortOrder') >= oldPosition).forEach((task) => task.decrementProperty('sortOrder'));
          otherTasks.filter((task) => task.get('sortOrder') > newPosition).forEach((task) => task.incrementProperty('sortOrder'));
        }

        console.log('hi...');

        task.set('sortOrder', newPosition);
      }
    });
    this.set('sortable', sortable);
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
      let position = this.get('list.tasks.length') + 1;
      let task = this.get('store').createRecord('task', {
        description,
        list,
        sortOrder: position
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
    //   let cloningTask = event.ctrlKey ? true : false;
    //
    //   this.set('dragClass', '');
    //
    //   this.get('store').findRecord('task', id).then((task) => cloningTask ? this.cloneTask(task) : this.moveTaskToList(task));
    },

    dragIn() {
      this.set('dragClass', 'active-drop-target');
    },
    dragOut() {
      this.set('dragClass', '');
    }
  }
});
