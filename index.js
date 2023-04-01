import axios from "axios";

// const baseURL = 'https://98160364-5da3-44f8-8cb8-d23a48ea0a21.mock.pstmn.io/validator';
const baseURL = 'https://j8s002.p.ssafy.io/validator';

const baseAPI = axios.create({
  baseURL,
  headers: {
    'chk': process.env.CHK,
    'Content-Type': 'application/json',
  }
});

//GitHub Actions시작
async function start() {
  return baseAPI
    .post(`/github-action`)
    .then((response) => response.data.action_id)
    .catch((err) => console.error(err.response.data, 'start Error!'));
}
//호출할 API 리스트 가져오기
async function getApiList() {
  return baseAPI
    .get(`/api`)
    .then((response) => response.data)
    .catch((err) => console.error(err.response.data, 'getApiList Error!'));
}
// 호출 결과 전달하기
async function sendResult(body) {
  return baseAPI
    .post(`/api/test`, body)
    .then((response) => response.data)
    .catch((err) => console.error(err.response.data, 'sendResult Error!'));
}
// Success/Fail횟수 전달하기
async function sendCounts(body) {
  return baseAPI
    .put(`/github-action`, body)
    .then((response) => response.data)
    .catch((err) => console.error(err.response.data, 'sendCounts Error!'));
}

// API에 따라 axios
async function createCall(method, baseURL, url, headers, params, body) {
  try {
    const response = await axios({
      method,
      baseURL,
      url,
      headers,
      params,
      data: body,
    });
    return response;
  } catch (err) {
    if (err.response.status >= 400) {
      return err.response;
    } else {
      console.error(`Create Call Failure... ${baseURL}${url}`);
      return { data: { status: 'FAILED' } };
    }
  }
}

async function callAndPost(actionId, api) {
  // [임시] Validator 에서 get/post 로 넘겨줘야 함
  let method = 'get';
  if (api.method == 1) method = 'post';

  // 2. API 호출하기
  const result = await createCall(method, api.baseURL, api.path, api.header, api.params, api.body);

  // 3. response 를 API Validator 에게 전달하기
  const body = {
    'action_id': actionId,
    'meta_id': api.meta_id,
    'response': result.data
  };

  const data = await sendResult(body);
  return data;
}

(async () => {
  // 1. GitHub Action 시작해서 action_id 가져오기
  const actionId = await start();
  console.log('actionId: ', actionId);

  // 2. API Validator 에서 호출할 API 리스트 가져오기
  let apiList = await getApiList();
  console.log('apiList: ', apiList);

  // 3. API 호출하고 실행 결과 가져오기
  let pArr = [];
  for (let api of apiList) {
    pArr.push(callAndPost(actionId, api));
  }
  const result = await Promise.all(pArr);
  console.log('RESULT:', result);

  // 4. Success, Fail 횟수 취합하기
  let success = 0, fail = 0;
  for (let el of result) {
    if (el === undefined) continue;

    if (el.result == false) fail++;
    else if (el.result == true) success++;
  }

  // 5. 취합한 결과를 보내주기
  const resultCount = await sendCounts({
    'action_id': actionId,
    'pass': success,
    'fail': fail
  });
  console.log('Result Count', resultCount);

})();
