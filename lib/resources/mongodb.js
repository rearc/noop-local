const ResourceContainer = require('../ResourceContainer')

class MongodbContainer extends ResourceContainer {
  constructor (resource, devServer) {
    super(resource, devServer)
  }

  getImage () {
    return 'mongo:4.1.1-xenial'
  }

  getEnv () {
    return {
      MONGO_INITDB_ROOT_USERNAME: 'noop',
      MONGO_INITDB_ROOT_PASSWORD: 'secret'
    }
  }

  setupRelationship (componentContainer, done) {
    console.log(`Creating relation from ${componentContainer.component.name} to ${this.resource.name}`)
    const params = {
      host: this.name,
      username: 'noop',
      password: 'secret',
      url: `mongodb://noop:secret@${this.name}`
    }
    componentContainer.dynamicParams.resources[this.friendlyName] = params
    done(null)
  }
}

module.exports = MongodbContainer