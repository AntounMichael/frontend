/* eslint ember/order-in-components: 0 */
import Component from '@ember/component';
import { computed } from '@ember/object';
import { isEmpty } from '@ember/utils';
import Table from 'ember-light-table';
import escapeRegExp from '../utils/escape-reg-exp';
import { task, timeout } from 'ember-concurrency';

export default Component.extend({
  classNames: ['session-table'],
  sortBy: null,
  filterBy: null,
  filterByLocalCache: null,
  sessions: null,

  table: computed('sortedSessions.[]', 'columns.[]', function(){
    const columns = this.get('columns');
    const sortedSessions = this.get('sortedSessions');

    return new Table(columns, sortedSessions);
  }),

  columns: computed('sortInfo', function(){
    const sortInfo = this.get('sortInfo');
    const expand = {
      type: 'expand-all',
      cellComponent: 'session-table-expand',
      width: '40px',
      sortable: false,
      align: 'center',
      breakpoints: ['smallScreen', 'mediumScreen', 'largeScreen', 'giantScreen'],
    };
    const title = {
      type: 'translatable-table-column',
      cellComponent: 'session-table-title',
      labelKey: 'general.title',
      valuePath: 'title',
      sortable: true,
      breakpoints: ['smallScreen', 'mediumScreen', 'largeScreen', 'giantScreen'],
    };
    const type = {
      type: 'translatable-table-column',
      labelKey: 'general.type',
      valuePath: 'sessionTypeTitle',
      sortable: true,
      width: '250px',
      breakpoints: ['giantScreen'],
    };
    const groups = {
      type: 'translatable-table-column',
      labelKey: 'general.groups',
      valuePath: 'learnerGroupCount',
      sortable: true,
      width: '90px',
      align: 'center',
      breakpoints: ['largeScreen', 'giantScreen'],
    };
    const firstOffering = {
      type: 'translatable-table-column',
      cellComponent: 'session-table-first-offering',
      labelKey: 'general.firstOffering',
      valuePath: 'firstOfferingDate',
      sortable: true,
      width: '175px',
      breakpoints: ['largeScreen', 'giantScreen'],
    };
    const offerings = {
      type: 'translatable-table-column',
      labelKey: 'general.offerings',
      valuePath: 'offeringCount',
      sortable: true,
      width: '100px',
      align: 'center',
      breakpoints: ['mediumScreen', 'largeScreen', 'giantScreen'],
    };
    const status = {
      type: 'translatable-table-column',
      cellComponent: 'session-table-status',
      labelKey: 'general.status',
      valuePath: 'status',
      sortable: true,
      width: '90px',
      align: 'center',
      breakpoints: ['mediumScreen', 'largeScreen', 'giantScreen'],
    };
    const actions = {
      cellComponent: 'session-table-actions',
      width: '40px',
      sortable: false,
      align: 'center',
      breakpoints: ['smallScreen', 'mediumScreen', 'largeScreen', 'giantScreen'],
    };

    let columns =  [expand, title, type, groups, firstOffering, offerings, status, actions];

    let sortColumn = columns.findBy('valuePath', sortInfo.column);
    sortColumn.sorted = true;
    sortColumn.ascending = !sortInfo.descending;

    return columns;
  }),

  height: computed('sessions.length', function(){
    const sessions = this.get('sessions');
    const count = sessions?sessions.length:0;

    return count < 10?'25vh':'75vh';
  }),
  filteredSessions: computed('sessions.[]', 'filterBy', function(){
    const sessions = this.get('sessions');
    const filterBy = this.get('filterBy');
    if (isEmpty(sessions)) {
      return [];
    }
    if (isEmpty(filterBy)) {
      return sessions;
    }

    let filterExpressions = filterBy.split(' ').map(function (string) {
      const clean = escapeRegExp(string);
      return new RegExp(clean, 'gi');
    });

    return sessions.filter(session => {
      let matchedSearchTerms = 0;

      for (let i = 0; i < filterExpressions.length; i++) {
        if (session.searchString.match(filterExpressions[i])) {
          matchedSearchTerms++;
        }
      }
      //if the number of matching search terms is equal to the number searched, return true
      return (matchedSearchTerms === filterExpressions.length);
    });
  }),

  sortedSessions: computed('filteredSessions.[]', 'sortInfo', function(){
    const sessions = this.get('filteredSessions');
    const sortInfo = this.get('sortInfo');

    if (sortInfo.descending) {
      return sessions.sortBy(sortInfo.column).reverse();
    }

    return sessions.sortBy(sortInfo.column);
  }),

  sortInfo: computed('sortBy', function(){
    const sortBy = this.get('sortBy');
    const parts = sortBy.split(':');
    const column = parts[0];
    const descending = parts.length > 1 && parts[1] === 'desc';

    return { column, descending, sortBy };
  }),

  filterByDebounced: computed('filterByLocalCache', 'filterBy', function(){
    const filterBy = this.get('filterBy');
    const filterByLocalCache = this.get('filterByLocalCache');
    const changeFilterBy = this.get('changeFilterBy');

    if (changeFilterBy.get('isIdle')) {
      return filterBy;
    }

    return filterByLocalCache;
  }),

  changeFilterBy: task(function * (value){
    const setFilterBy = this.get('setFilterBy');
    this.set('filterByLocalCache', value);
    yield timeout(250);
    setFilterBy(value);
  }).restartable(),

  removeSession: task(function * (session){
    session.deleteRecord();
    yield session.save();
  }).drop(),

  expandOrCollapseAllRows() {
    const { rows } = this.get('table');
    const allRowsExpanded = rows.isEvery('expanded', true);
    if (allRowsExpanded) {
      rows.setEach('expanded', false);
    } else {
      rows.setEach('expanded', true);
    }
  },

  actions: {
    columnClicked(column){
      if (column.get('sortable')) {
        const what = column.get('valuePath');
        const direction = column.ascending ? '' : ':desc';
        this.get('setSortBy')(`${what}${direction}`);
      }
      if (column.get('type') === 'expand-all') {
        // this.expandOrCollapseAllRows();
      }
    },
    remove(session){
      session.deleteRecord();
      session.save();
    },
    cancelRemove(row){
      row.set('confirmDelete', false);
      row.set('expanded', false);
    },
  }
});
