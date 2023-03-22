import axios from "axios";

const baseURL = 'https://j8s002.p.ssafy.io/validator';

const baseAPI = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  }
});

//호출할 API 리스트 가져오기
async function getApiList() {
  return baseAPI
    .get(`/api`)
    .then((response) => response.data)
    .catch((err) => {
      console.log(err.response);
    });
}
// 호출 결과 전달하기
async function sendResult(body) {
  return baseAPI
    .post(`/api/test`, body)
    .then(response)
    .catch((err) => console.error(err, 'sendResult Error!'));
}

// API에 따라 axios
async function createCall(method, baseURL, url, headers, params, body) {
  return await axios({
    method,
    baseURL,
    url,
    headers,
    params,
    data: body,
  });
}

async function callAndPost(api) {
  // [임시] Validator 에서 get/post 로 넘겨줘야 함
  let method = 'get';
  if (api.method != 0) method = 'post';

  // 2. API 호출하기
  const result = await createCall(method, api.baseURL, api.path, api.header, api.params, api.body);
  console.log(`${api.path} 호출결과: ${result}`);
  // 3. response 를 API Validator 에게 전달하기
  const body = {
    //'action_id': ?
    'meta_id': api.meta_id,
    'response': result.data
  };
  //sendResult(body);
}

(async () => {
  // 1. API Validator 에서 호출할 API 리스트 가져오기
  let apiList = await getApiList();
  console.log('apiList: ', apiList);

  let pArr = [];
  for (let api of apiList) {
    pArr.push(callAndPost(api));
  }
  await Promise.all(pArr);
})();
