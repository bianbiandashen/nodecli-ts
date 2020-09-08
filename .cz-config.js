'use strict';

module.exports = {
  types: [
    { value: 'feat', name: 'feat:      新增一个功能' },
    { value: 'fix', name: 'fix:       修复一个 Bug' },
    { value: 'docs', name: 'docs:      文档变更（更新文档、Demo）' },
    {
      value: 'style',
      name:
        'style:     代码风格变更（不影响功能，解决代码冲突、eslint 校验修改等）'
    },
    {
      value: 'refactor',
      name:
        'refactor:  代码重构（不影响功能，即不是新增功能，也不是修改bug的代码变动）'
    },
    {
      value: 'chore',
      name: 'chore:     开发工具变动（框架改动、eslint规则变动等）'
    },
    { value: 'test', name: 'test:      增加测试' },
    { value: 'perf', name: 'perf:      改善性能' },
    {
      value: 'revert',
      name: 'revert:    代码回退（如果当前 commit 用于撤销以前的 commit）'
    }
  ],

  scopes: [
    { name: 'controller' },
    { name: 'service' },
    { name: 'model' }
  ],

  // override the messages, defaults are as follows
  messages: {
    type: "Select the type of change that you're committing:",
    scope: 'Denote the SCOPE of this change (optional):',
    // used if allowCustomScopes is true
    customScope: 'Denote the SCOPE of this change:',
    subject: 'Write a SHORT, IMPERATIVE tense description of the change:\n',
    body:
      'Provide a LONGER description of the change (optional). Use "|" to break new line:\n',
    breaking: 'List any BREAKING CHANGES (optional):\n',
    footer:
      'List any ISSUES CLOSED by this change (optional). E.g.: #31, #34:\n',
    confirmCommit: 'Are you sure you want to proceed with the commit above?'
  },

  allowCustomScopes: true,
  allowBreakingChanges: ['feat', 'fix'],

  // limit subject length
  subjectLimit: 100
};
