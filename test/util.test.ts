const assert = require('assert')

import {deepAssign} from '../src/utils'

describe('deepAssign', function () {
  let target = {}
  beforeEach(() => {
    // deepAssign mutates target
    // so reassign it
    target = {
      greeting: 'Hello',
      name: 'world',
      nested: {
        bool: true,
        int: 123,
        string: '!',
      },
      arrayUnchanged: [1, 2, 3],
      array1: [
        {
          id: 0,
          description: 'foo',
        },
        {
          id: 1,
          description: 'bar',
        },
        {
          id: 2,
          description: 'baz',
        },
      ],
    }
  })

  const source = {
    name: 'leif',
    nested: {
      bool: false,
    },
    array1: [
      {
        id: 3,
        description: 'qux',
      },
    ],
  }

  it('should replace the array', function () {
    const expected = {
      greeting: 'Hello',
      name: 'leif',
      nested: {
        bool: false,
        int: 123,
        string: '!',
      },
      arrayUnchanged: [1, 2, 3],
      array1: [
        {
          id: 3,
          description: 'qux',
        },
      ],
    }
    const actual = deepAssign(target, source)
    assert.deepStrictEqual(actual, expected)
  })

  it('should concat the array', function () {
    const expected = {
      greeting: 'Hello',
      name: 'leif',
      nested: {
        bool: false,
        int: 123,
        string: '!',
      },
      arrayUnchanged: [1, 2, 3],
      array1: [
        {
          id: 0,
          description: 'foo',
        },
        {
          id: 1,
          description: 'bar',
        },
        {
          id: 2,
          description: 'baz',
        },
        {
          id: 3,
          description: 'qux',
        },
      ],
    }
    const actual = deepAssign(target, source, {arrayBehavior: 'concat'})
    assert.deepStrictEqual(actual, expected)
  })

  it('should merge the array on indexes', function () {
    const source = {
      name: 'leif',
      nested: {
        bool: false,
      },
      array1: [
        {},
        {description: 'qux'},
        'mixed type',
        {
          id: 3,
          description: 'qux',
        },
      ],
    }

    const expected = {
      greeting: 'Hello',
      name: 'leif',
      nested: {
        bool: false,
        int: 123,
        string: '!',
      },
      arrayUnchanged: [1, 2, 3],
      array1: [
        {
          id: 0,
          description: 'foo',
        },
        {
          id: 1,
          description: 'qux',
        },
        'mixed type',
        {
          id: 3,
          description: 'qux',
        },
      ],
    }
    const actual = deepAssign(target, source, {arrayBehavior: 'merge'})
    assert.deepStrictEqual(actual, expected)
  })

  it('should use unique-object-keys method for handling array', function () {
    const target = {
      workflows: [
        {foo: {
          id: 0,
          desc: 'foo',
        }},
        {bar: {
          id: 1,
          desc: 'bar',
        }},
        {baz: {
          id: 2,
          desc: 'baz',
          array: [0, 1, 2],
        }},
      ],
    }

    const source = {
      workflows: [
        {
          baz: {
            id: 2,
            desc: 'updated',
            array: [3, 2, 1],
          },
        },
        {
          qux: {
            id: 3,
            desc: 'qux',
          },
        },
      ],
    }

    const expected = {
      workflows: [
        {
          foo: {
            id: 0,
            desc: 'foo',
          },
        },
        {
          bar: {
            id: 1,
            desc: 'bar',
          },
        },
        {
          baz: {
            id: 2,
            desc: 'updated',
            array: [3, 2, 1],
          },
        },
        {
          qux: {
            id: 3,
            desc: 'qux',
          },
        },
      ],
    }
    const actual = deepAssign(target, source, {arrayBehavior: 'unique-key-objects'})
    assert.deepStrictEqual(actual, expected)
  })
})
