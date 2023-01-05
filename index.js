// ⚡️ Import Styles
import './style.scss';
import feather from 'feather-icons';
import axios from 'axios';
import { showNotification } from './modules/showNotification.js';

// ⚡️ Render Skeleton
document.querySelector('#app').innerHTML = `
<div class='app-container'>
  <div class='todo'>
    <h2 class='title'>Todo</h2>
    <div class='main'>
      <form autocomplete='off' data-form=''>
        <label>
          <input name='todo' type='text' placeholder='New todo'>
        </label>
        <select name='user' data-select=''>
          <option disabled selected>Select user</option>
        </select>
        <button type='submit'>Add Todo</button>
      </form>
      <ul data-list></ul>
    </div>
  </div>

  <a class='app-author' href='https://github.com/nagoev-alim' target='_blank'>${feather.icons.github.toSvg()}</a>
</div>
`;

// ⚡️Create Class
class App {
  constructor() {
    this.DOM = {
      form: document.querySelector('[data-form]'),
      list: document.querySelector('[data-list]'),
      select: document.querySelector('[data-select]'),
    };

    this.PROPS = {
      axios: axios.create({
        baseURL: 'https://jsonplaceholder.typicode.com/',
      }),
      todos: [],
      users: [],
    };

    this.fetchData();
    this.DOM.form.addEventListener('submit', this.onSubmit);
    this.DOM.list.addEventListener('change', this.handleChange);
    this.DOM.list.addEventListener('click', this.handleDelete);
  }

  /**
   * @function fetchData - Fetch data from API
   * @returns {Promise<void>}
   */
  fetchData = async () => {
    try {
      const [todos, users] = await Promise.all([
        this.PROPS.axios.get('/todos?_limit=15'),
        this.PROPS.axios.get('/users'),
      ]);
      this.PROPS.todos = todos.data;
      this.PROPS.users = users.data;

      this.renderData('todos', this.PROPS.todos);
      this.renderData('users', this.PROPS.users);
    } catch (e) {
      console.log(e);
      showNotification('danger', 'Something wrong :(');
    }
  };

  /**
   * @function renderData - Render Todos and Users HTML
   * @param type
   * @param data
   */
  renderData = (type, data) => {
    switch (type) {
      case 'todos':
        this.DOM.list.innerHTML = `
        ${data.map(({ userId, id, title, completed }) => `
          <li data-id='${id}'>
            <label>
              ${completed ? `<input type='checkbox' checked data-checkbox=''>` : `<input type='checkbox' data-checkbox=''>`}
              <span class='checkbox'></span>
            </label>
            <p>${title}<span>${this.getUserName(userId)}</span></p>
            <button data-delete='${id}'>${feather.icons.x.toSvg()}</button>
          </li>
        `).join('')}`;
        break;

      case 'users':
        this.DOM.select.innerHTML = `
        <option disabled selected>Select user</option>
        ${data.map(({ id, name }) => `<option value='${id}'>${name}</option>`).join('')}`;
        break;

      case 'todo':
        const todo = document.createElement('li');
        todo.dataset.id = data.id;
        todo.innerHTML = `
        <label>
          <input type='checkbox' data-checkbox=''>
          <span class='checkbox'></span>
        </label>
        <p>${data.title}<span>${this.getUserName(data.userId)}</span></p>
        <button data-delete='${data.id}'>${feather.icons.x.toSvg()}</button>`;
        this.DOM.list.prepend(todo);
        break;
      default:
        break;
    }
  };

  /**
   * @function getUserName - Get user name by ID
   * @param userId
   */
  getUserName = (userId) => this.PROPS.users.find(({ id }) => id === userId).name;

  /**
   * @function onSubmit - Form submit handler
   * @param event
   */
  onSubmit = (event) => {
    event.preventDefault();
    const { user, todo } = Object.fromEntries(new FormData(event.target).entries());

    this.createTodo({
      userId: Number(user),
      title: todo,
      completed: false,
    });
  };

  /**
   * @function createTodo - Create new todo after send POST requests
   * @param todo
   * @returns {Promise<void>}
   */
  createTodo = async (todo) => {
    try {
      const { data: { id, todo: { userId, title, completed } } } = await this.PROPS.axios.post('/todos', { todo });
      this.renderData('todo', { id, userId, title, completed });
    } catch (e) {
      showNotification('danger', 'Something went wrong, open dev console.');
      console.log(e);
    }
  };

  /**
   * @function handleChange - Checkbox change event handler
   * @param id
   * @param checked
   * @returns {Promise<void>}
   */
  handleChange = async ({ target: { parentElement: { dataset: { id } }, checked: completed } }) => {
    try {
      await this.PROPS.axios.patch(`/todos/${id}`, { completed });
    } catch (e) {
      showNotification('danger', 'Something went wrong, open dev console.');
      console.log(e);
    }
  };

  /**
   * @function handleDelete - Delete event handler
   * @param target
   * @returns {Promise<void>}
   */
  handleDelete = async ({ target }) => {
    if (target.tagName === 'BUTTON' && window.confirm('Are you sure to delete?')) {
      const todoId = Number(target.dataset.delete);
      try {
        const { status } = await this.PROPS.axios.delete(`/todos/${todoId}`);
        if (status === 200) {
          this.PROPS.todos = this.PROPS.todos.filter(({ id }) => id !== todoId);
          this.renderData('todos', this.PROPS.todos);
        }
      } catch (e) {
        showNotification('danger', 'Something went wrong, open dev console.');
        console.log(e);
      }
    }

  };
}

// ⚡️Class instance
new App();
