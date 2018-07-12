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
      group: {
        name: 'a list',
        pull(a, b, c, evt) {
          console.log('pull evt: %O', evt);
          return evt.ctrlKey ? 'clone' : true;
        }
      },
      onEnd: (evt) => {
        let { from, to } = evt;
        let fromListId = from.dataset.listId;
        let toListId = to.dataset.listId;

        let { oldIndex, newIndex } = evt;
        let oldPosition = oldIndex + 1;
        let newPosition = newIndex + 1;

        let element = evt.item;
        let task = this.list.get('tasks').find((task) => task.get('id') === element.dataset.taskId);

        if (fromListId !== toListId) {
          console.log('evt: %O', evt);
          if (evt.ctrlKey) {
            throw "clone!"
          } else {
            this.moveTaskToDifferentList(task, toListId, newPosition);
          }
        } else {
          this.changePositionOfTask(task, oldPosition, newPosition);
        }
      }
    });
    this.set('sortable', sortable);
  },

  willDestroyElement() {
    this.$('.task-list-header').off('click');
  },

  changePositionOfTask(task, oldPosition, newPosition) {
    if (oldPosition === newPosition) return;

    let thisTaskId = task.id;
    let otherTasks = this.list.get('tasks').filter((task) => task.id !== thisTaskId);

    if (oldPosition < newPosition) {
      newPosition--;
    }

    otherTasks.filter((task) => task.sortOrder >= oldPosition).invoke('decrementProperty', 'sortOrder');
    otherTasks.filter((task) => task.sortOrder > newPosition).invoke('incrementProperty', 'sortOrder');
    task.set('sortOrder', newPosition);

    this.get('list.tasks').invoke('save');
  },

  moveTaskToDifferentList(task, targetListId, position) {
    let currentPosition = task.sortOrder;

    let targetList = this.store.peekRecord('list', targetListId);

    // move tasks in current list up one position
    let tasksInOldList = this.list.get('tasks').filter((task) => task.sortOrder > currentPosition);
    tasksInOldList.invoke('decrementProperty', 'sortOrder');

    // make room in new list
    let tasksInNewList = targetList.get('tasks').filter((task) => task.sortOrder >= position);
    tasksInNewList.invoke('incrementProperty', 'sortOrder');

    // set list & position for task
    task.setProperties({
      list: targetList,
      sortOrder: position
    });

    // save everything that changed
    task.save();
    tasksInOldList.invoke('save');
    tasksInNewList.invoke('save');
  },

  cloneTask(task) {
    let newTask = this.store.createRecord('task', {
      list: this.list,
      description: task.description
    });
    newTask.save();
  },
  moveTaskToList(task) {
    task.set('list', this.get('list'));
    task.save();
  },

  actions: {
    addTask() {
      let description = this.newTaskDescription.trim();
      if (!description) {
        return;
      }
      let list = this.get('list');
      let position = this.get('list.tasks.length') + 1;
      let task = this.store.createRecord('task', {
        description,
        list,
        sortOrder: position
      });

      this.set('newTaskDescription', '');

      next(() => {
        task.save()
          .catch((err) => this.flashMessages.error(err));
      });
    },

    clearTextarea() {
      this.newTaskDescription = '';
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
