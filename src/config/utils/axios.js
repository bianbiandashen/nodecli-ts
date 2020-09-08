
let axios = require('axios')

module.exports = function (url, data, option) {
  return axios({
    method: 'post',
    url,
    data,
    timeout: 3000,
    ...option
  })
}
