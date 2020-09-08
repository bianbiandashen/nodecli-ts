'use strict';

module.exports = app => {
  const {
    model
  } = app
  const schema = 'public'
  const orbitalPreset = require('../../schema/tb_orbital_preset')(app)
  const OrbitalPreset = model.define('tb_orbital_preset', orbitalPreset, {
    schema
  })
  const {
    Model
  } = require('../core/transactionalDeco/index')
  class Query {
    app=app
    @Model
    async savePreset(presetId, orbitalId, orbitalPreset) {
      const time = this.app.dateFormatter(new Date(), 'yyyy-MM-dd hh:mm:ss')
      const res = await (this as any).query(`
        INSERT INTO tb_orbital_preset VALUES ($presetId,$orbitalId,$orbitalPreset,$time,$time)
      `, {
        bind: {
          presetId,
          orbitalId,
          orbitalPreset,
          time
        }
      });
      return this.app.toHumpJson(res[0])
    }
    @Model
    async getPresetByOrbitalIdAndPreset(orbitalId, orbitalPreset) {

      const res = await (this as any).query(`
        SELECT * FROM tb_orbital_preset WHERE ORBITAL_ID = $orbitalId AND PRESET_NO = $orbitalPreset
      `, {
        bind: {
          orbitalId,
          orbitalPreset
        }
      });
      return this.app.toHumpJson(res[0])
    }
    @Model
    async deletePreset(presetId) {

      const res = await (this as any).query(`
        DELETE TB_ORBITAL_PRESET WHERE PRESET_ID = $presetId
      `, {
        bind: {
          presetId
        }
      });
      return this.app.toHumpJson(res[0])
    }
  }
  OrbitalPreset.query = new Query()
  return OrbitalPreset;
};
