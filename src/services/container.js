const R = require('ramda');

function Container() {
  this.services = {};
}

Container.prototype.register = function (name, definition, dependencies) {
  this.services[name] = { definition, dependencies };
};

Container.prototype.get = async function (name) {
  let service = this.services[name];

  if (service === undefined) {
    throw new Error(`Unable to get ${name} from container`);
  }

  let fn;
  if (typeof service.definition === 'function') {
    // Curry and create a new function.
    fn = R.curry(service.definition);
  } else {
    return service.definition;
  }

  if (service.dependencies) {
    for (const dep of service.dependencies) {
      fn = await fn(await this.get(dep));
    }
  }

  return fn();
};

module.exports = Container;
