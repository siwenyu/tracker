const { pathToRegexp } = require('path-to-regexp');
const ufHashMapData = {
  'v2/content': [
    {
      route: 'platform-content/workbench'
    },
    {
      route: 'platform-content/settings'
    },
    {
      route: 'platform-content/inspect'
    },
    {
      route: 'platform-content/evidence'
    },
    {
      route: 'platform-content/backstage'
    },
    {
      route: 'platform-content/workbench/market'
    },
    {
      route: 'platform-content/bigevent'
    },
    {
      route: 'platform-content/bigevent/edit/:id'
    },
    {
      route: 'platform-content/settings/product/inspect/:bizType/:business/:product'
    },
    {
      route: 'platform-content/settings/business/:business/:product'
    },
    {
      route: 'platform-content/productAccess/:business'
    },
    {
      route: 'platform-content/settings/product/riskaccess/:type/:business/:product'
    },
    {
      route: 'platform-content/productAccess/:business/:product'
    },
    {
      route: 'platform-content/settings/business'
    },
    {
      route: '/platform-content/settings/product/score'
    },
    {
      route: '/platform-content/settings/product/review/:business/:product'
    },
    {
      route: 'platform-content/settings/product/:type/:business/:product'
    },
    {
      route: 'platform-content/access/configManager/:type/:business/:product'
    }
  ],
  'v2/platform-account': [
    {
      route: 'platform-account/siteinfo/list'
    },
    {
      route: 'platform-account/siteinfo/punishConfig/:editType/:siteId/:riskId/:riskInfoGroupId/:entranceId'
    },
    {
      route: 'platform-account/siteinfo/risk/:siteId/:riskId/:ruleId?'
    },
    {
      route: 'platform-account/systemManage/site/list'
    },
    {
      route: 'platform-account/systemManage/site/edit/:id?'
    },
    {
      route: 'platform-account/machineprotect/list'
    },
    {
      route: 'platform-account/machineprotect/detail/:id/:type?'
    },
    {
      route: 'platform-account/statistic/monitor/machineBehavior/:siteId/:riskId/:protectionStrategyId/:id/:entranceId'
    },
    {
      route: 'platform-account/statistic/report'
    }
  ],
  'v2/goods': [
    {
      route: 'platform-products/**'
    },
    {
      route: 'platform-products/workbench'
    },
    {
      route: 'platform-products/treat/detail/:id'
    },
    {
      route: 'platform-products/witness'
    }
  ],
  'v2/activity': [
    {
      route: 'platform-activity/workBench'
    },
    {
      route: 'platform-activity/activityCenter'
    },
    {
      route: 'platform-activity/activityMonitoring'
    },
    {
      route: 'platform-activity/searchPunishResult'
    },
    {
      route: 'platform-activity/nameList'
    },
    {
      route: 'platform-activity/intelligentEvaluation'
    },
    {
      route: 'platform-activity/activityCenterCreate'
    },
    {
      route: 'platform-activity/liftingActivities'
    },
    {
      route: 'platform-activity/activityStrategyDay'
    },
    {
      route: 'platform-activity/historicalEdition'
    },
    {
      route: 'platform-activity/versionComparison'
    },
    {
      route: 'platform-activity/noAuthority'
    },
    {
      route: 'platform-activity/transfer'
    },
    {
      route: 'platform-activity/createConfigure'
    }
  ],
  'v2/channel': [
    {
      route: 'platform-channel/workbench/CPI'
    },
    {
      route: 'platform-channel/workbench/CPS'
    },
    {
      route: 'platform-channel/monitor/CPS'
    },
    {
      route: 'platform-channel/monitor/CPI'
    },
    {
      route: 'platform-channel/monitor/CPI/:type'
    },
    {
      route: 'platform-channel/setting/detail'
    },
    {
      route: 'platform-channel/setting/snapshot/:channelType/:id'
    },
    {
      route: 'platform-channel/setting/Wmsnapshot/:channelType/:id'
    },
    {
      route: 'platform-channel/setting/snapshotEdit/:channelType/:id'
    },
    {
      route: 'platform-channel/setting/WmsnapshotEdit/:channelType/:id'
    },
    {
      route: 'platform-channel/setting/detail/:type'
    },
    {
      route: 'platform-channel/witness'
    }
  ],
  'v2/huangniu': [
    {
      route: 'wing/scalper'
    },
    {
      route: 'wing/scalper/2'
    }
  ],
  'v2/riskProtect': [
    {
      route: 'dashboard/index'
    },
    {
      route: 'rccanvas/list'
    },
    {
      route: 'strategy/architecture'
    },
    {
      route: 'dashboard/index'
    },
    {
      route: 'dashboard/index/:id'
    },
    {
      route: 'dashboard/qms/:id'
    },
    {
      route: 'dashboard/qms'
    },
    {
      route: 'strategy/list'
    },
    {
      route: 'rccanvas/:mode/:id'
    },
    {
      route: 'rccanvas'
    },
    {
      route: 'strategy/architecture/:riskTypeId?/:eventCode?'
    },
    {
      route: 'strategy/canvas/:riskTypeId?/:eventCode?'
    },
    {
      route: 'strategy/canvas'
    },
    {
      route: 'strategy/list'
    }
  ],
  'v2/riskDefine': [
    {
      route: 'event'
    },
    {
      route: 'risk/category/manage'
    },
    {
      route: 'metacenter/meta/riskMgr2'
    },
    {
      route: 'metacenter/meta/riskTagMgr'
    },
    {
      route: 'metacenter/meta/kvMgr'
    },
    {
      route: 'event/deployment/:code'
    },
    {
      route: 'event/deployment'
    },
    {
      route: 'event/preProcess/:code'
    },
    {
      route: 'event/completeCode/:code'
    },
    {
      route: 'event/cloudManage/:code'
    },
    {
      route: 'event/featureCleanManage'
    },
    {
      route: 'event/featureMap/:code'
    },
    {
      route: 'event/eventRunAnalysis/:eventCode'
    },
    {
      route: 'event/gradevar/:code'
    },
    {
      route: 'event/createDeployment/:aim'
    },
    {
      route: 'event/addDefense/:aim'
    },
    {
      route: 'event/addOffline/:aim'
    },
    {
      route: 'event/columnMgr/:code'
    },
    {
      route: 'event/createOffline'
    },
    {
      route: 'event/createDefense'
    },
    {
      route: 'bizcode/config/:code'
    },
    {
      route: 'bizcode/gray/:code'
    },
    {
      route: 'event/versionComp/:code'
    },
    {
      route: 'event/versionDetail/:id/:id'
    },
    {
      route: 'event/columndetail/:eventCode/:columnCode'
    },
    {
      route: 'event/cloudAccountManage/:code'
    },
    {
      route: 'event/createOffline/:code'
    },
    {
      route: 'event/createDefense/:code'
    },
    {
      route: 'metacenter/meta/riskAction/new'
    },
    {
      route: 'metacenter/meta/riskAction/edit/:id'
    },
    {
      route: 'metacenter/meta/riskAction/editMulti/:ids'
    },
    {
      route: 'metacenter/meta/riskTagMgr/:target'
    }
  ],
  'v2/riskRecognition': [
    {
      route: 'ruleManage'
    },
    {
      route: 'ruleManage/2'
    },
    {
      route: 'inspect/search'
    },
    {
      route: 'flow/:flowId'
    },
    {
      route: 'nlineengine/task/list'
    },
    {
      route: 'mteerule/algDispatch'
    },
    {
      route: 'assethub/model/modelList'
    },
    {
      route: 'ruleManage/ruleSet/edit/:ruleSetId'
    },
    {
      route: 'ruleManage/ruleSet/version/:ruleSetId'
    },
    {
      route: 'ruleManage/ruleSet/data/:ruleSetId'
    },
    {
      route: 'ruleManage/RuleSetRunData/:ruleSetId'
    },
    {
      route: 'ruleManage/rule/edit/:ruleId'
    },
    {
      route: 'ruleManage/rule/version/:ruleId'
    },
    {
      route: 'ruleManage/rule/data/:ruleId'
    },
    {
      route: 'ruleManage/rule/data/:eventCode/:ruleSetId/:ruleId/:version/:subversion'
    },
    {
      route: 'ruleManage/rule/view/:ruleId/:version/:subversion/:type'
    },
    {
      route: 'ruleManage/rule/ruleContrast/:ruleId/:version1/:version2'
    },
    {
      route: 'ruleManage/RuleRunData/:ruleSetId/:ruleId'
    },
    {
      route: 'ruleManage/rule/graycontrast/:ruleId/:version1/:version2/:eventId/:rpcId'
    },
    {
      route: 'ruleManage/rule/grayresult/:ruleId/:version'
    },
    {
      route: 'ruleManage/rule/graylist/:ruleId'
    },
    {
      route: 'ruleManage/rule/gray/:eventCode/:ruleSet/:ruleId'
    },
    {
      route: 'ruleManage/grayrelease/:ruleId/:flowId'
    },
    {
      route: 'ruleManage/grayrelease/:type/:ruleId/:flowId?'
    },
    {
      route: 'ruleManage/search/:keyword'
    },
    {
      route: 'ruleManage/rule/debug/:eventCode?/:ruleId?/:ruleVersion?'
    },
    {
      route: 'ruleManage/rule/debug/:importType(restore)/:eventCode/:ruleId/:ruleVersion/:jobId/:scanTime/:eventId/:rpcId'
    },
    {
      route: 'ruleManage/rule/add/:ruleSetId'
    },
    {
      route: 'ruleManage/rule/edit/:ruleId/:version/:subversion'
    },
    {
      route: 'ruleManage/ruleSet/add'
    },
    {
      route: 'ruleManage/ruleSet/edit/:ruleSetId/:action'
    },
    {
      route: 'ruleManage/2'
    },
    {
      route: 'ruleManage/ruleSet/addPissa'
    },
    {
      route: 'inspect/similar'
    },
    {
      route: 'nlineengine/task/detail/:jobid'
    },
    {
      route: 'nlineengine/task/publishmanage/:taskid'
    },
    {
      route: 'nlineengine/task/list/:authority?'
    },
    {
      route: 'nlineengine/resource/manage/:authority?'
    },
    {
      route: 'nlineengine/task/grayflow/:flowId'
    },
    {
      route: 'nlineengine/dataSourceManage/list'
    },
    {
      route: 'mteerule/dispatchEdit'
    },
    {
      route: 'mteerule/algDispatch/record/:id'
    },
    {
      route: '/algo/searchAlgo.json'
    },
    {
      route: '支持算法'
    },
    {
      route: 'assethub/model/modelDetail'
    },
    {
      route: 'assethub/model/modelOperation'
    }
  ],
  'v2/dataassets': [
    {
      route: 'event/entityMgr'
    },
    {
      route: 'event/indicatorMgr'
    },
    {
      route: 'function'
    },
    {
      route: 'dashboard/dataAsset'
    },
    {
      route: 'event/entityDetail/:type/:id/:code'
    },
    {
      route: 'event/entityEdit/:code'
    },
    {
      route: 'event/entityAdding'
    },
    {
      route: 'event/intEntity'
    },
    {
      route: 'eunomia/feature'
    },
    {
      route: 'metacenter/meta/indicator/:moudle'
    },
    {
      route: 'metacenter/meta/offLineIndi/:moudle'
    },
    {
      route: 'sampool/namelist/list'
    },
    {
      route: 'sampool/application/list'
    },
    {
      route: 'sampool/namelist/:module'
    },
    {
      route: 'sampool/application/:module'
    },
    {
      route: 'assethub/sampool/package/list'
    },
    {
      route: 'assethub/sampool/keyword/list'
    },
    {
      route: 'sampool/text/list'
    },
    {
      route: 'sampool/picture/list'
    },
    {
      route: 'sampool/video/list'
    },
    {
      route: 'sampool/audio/list'
    },
    {
      route: 'assethub/sampool/package/add'
    },
    {
      route: 'assethub/sampool/package/edit/:id'
    },
    {
      route: 'assethub/sampool/package/save'
    },
    {
      route: 'assethub/sampool/keyword/add'
    },
    {
      route: 'assethub/sampool/keyword/edit/:id'
    },
    {
      route: 'assethub/sampool/keyword/save'
    },
    {
      route: 'assethub/sampool/keyword/editAll'
    },
    {
      route: 'assethub/sampool/keyword/view/:id'
    },
    {
      route: 'sampool/text/:module'
    },
    {
      route: 'sampool/picture/:module'
    },
    {
      route: 'sampool/video/:module'
    },
    {
      route: 'function/functionEdit'
    },
    {
      route: 'function/functionHistory/:code'
    },
    {
      route: 'function/functionMerge/:code'
    },
    {
      route: 'function/functionMerge/:code/:ids'
    },
    {
      route: 'function/functionEdit/:code'
    }
  ],
  'v2/riskAudit': [
    {
      route: 'rcp/show'
    },
    {
      route: 'rcp/admin/app/list'
    },
    {
      route: 'rcp/front/spot/list'
    },
    {
      route: 'rcp/front/smart/list'
    },
    {
      route: 'rcp/show/**'
    },
    {
      route: 'rcp/front/**'
    },
    {
      route: 'rcp/admin/**'
    },
    {
      route: 'rcp/spot/**'
    },
    {
      route: 'rcp/smart/**'
    }
  ],
  'v2/restore/home': [
    {
      route: 'restore/home'
    },
    {
      route: 'restore/:jobId/:scanTime/:eventId/:rpcId/:ruleId'
    },
    {
      route: 'allRouterInfo/:jobId/:scanTime/:eventId/:rpcId'
    },
    {
      route: 'restore/home/:jobId'
    },
    {
      route: 'restore/jobrule/:eventCode/:ruleId/:version'
    },
    {
      route: 'allRouterSearchHistory'
    },
    {
      route: 'restore/error'
    }
  ],
  'v2/capability/consumer/list': [
    {
      route: 'capability/consumer/rule/list'
    },
    {
      route: 'capability/consumer/data/list'
    }
  ],
  'v2/userCenter': [
    {
      route: 'permission/usergroup/list'
    },
    {
      route: 'permission/apply'
    },
    {
      route: 'permission/own'
    },
    {
      route: 'userCenter'
    },
    {
      route: 'permission/usergroup/add'
    },
    {
      route: 'permission/usergroup/edit/:groupId'
    },
    {
      route: 'permission/usergroup/detail/:groupId/:type?'
    },
    {
      route: 'permission/usergroup/apply/:pkgCode'
    },
    {
      route: 'permission/usergroup/new'
    },
    {
      route: 'userCenter/waitIDealTaskApp'
    },
    {
      route: 'userCenter/iprocessedTaskApp'
    },
    {
      route: 'userCenter/iInitiatedTaskApp'
    },
    {
      route: 'userCenter/flowApprovalApp/:id'
    },
    {
      route: 'userCenter/iInitiatedTask'
    },
    {
      route: 'userCenter/waitIDealTaskApp'
    },
    {
      route: 'userCenter/flowApprovalPage/:id'
    },
    {
      route: 'userCenter/iProcessedTask'
    },
    {
      route: 'userCenter/waitIDealTask'
    }
  ],
  'v2/sanction': [
    {
      route: 'assethub/sanction/list'
    },
    {
      route: 'assethub/sanction/manage'
    }
  ],
  'v2/serviceOperating': [
    {
      route: 'capability/producer/list'
    },
    {
      route: 'capability/producer/list/strategy'
    },
    {
      route: 'capability/producer/list/data'
    },
    {
      route: 'capability/producer/list/:serviceType'
    },
    {
      route: 'capability/edit/**'
    },
    {
      route: 'capability/statistic/:role/:serviceCode'
    },
    {
      route: 'capability/:role/detail/:serviceCode'
    },
    {
      route: 'capability/producer/gray/:serviceCode'
    }
  ],
  'v2/platformOps': [
    {
      route: 'bizcode'
    },
    {
      route: 'prevention'
    },
    {
      route: 'opBackstage/flowBgList'
    },
    {
      route: 'userCenter/tools'
    },
    {
      route: 'userCenter/blueRobotConfig'
    },
    {
      route: 'bundle/metaList'
    },
    {
      route: 'bundle/propertyList'
    },
    {
      route: 'bundle/publishLogList'
    },
    {
      route: 'inspect-admin/index'
    },
    {
      route: 'inspect-admin/strategy'
    },
    {
      route: 'nlineengine/resource/manage/admin'
    },
    {
      route: 'assethub/model/token'
    },
    {
      route: 'assethub/model/cluster'
    },
    {
      route: 'assethub/model/env'
    },
    {
      route: 'dashboard/dataIsolation'
    },
    {
      route: 'assethub/model/list'
    },
    {
      route: 'techBackstage/originalData'
    },
    {
      route: 'techBackstage/eventList'
    },
    {
      route: 'techBackstage/replicatequery'
    },
    {
      route: 'notify/publish/manage'
    },
    {
      route: 'event/ScriptExecute'
    },
    {
      route: 'opBackstage/tenantList'
    },
    {
      route: 'clusterManage'
    },
    {
      route: 'opBackstage/regionConfiguration'
    },
    {
      route: 'opBackstage/appAssetMgt'
    },
    {
      route: 'prevention/meta'
    },
    {
      route: 'permission/package/list'
    },
    {
      route: 'risk/category/migrate'
    },
    {
      route: 'userCenter/clusterNodesManage/:tenantCode'
    },
    {
      route: 'bundle/runtime'
    },
    {
      route: 'restore/error'
    },
    {
      route: 'rccanvas/migratetools'
    },
    {
      route: 'opBackstage/featureTreeConfig'
    },
    {
      route: 'bizcode/gray/:code'
    },
    {
      route: 'prevention/feature/:code'
    },
    {
      route: 'prevention/import/:code'
    },
    {
      route: 'opBackstage/flowBgSetting/:flowCode'
    },
    {
      route: 'opBackstage/flowBgEdit/:id'
    },
    {
      route: 'opBackstage/flowBgCreate'
    },
    {
      route: 'userCenter/searchWordConfig'
    },
    {
      route: 'userCenter/blueRobotConfig'
    },
    {
      route: 'bundle/metaEdit/edit/:id'
    },
    {
      route: 'bundle/metaEdit/new'
    },
    {
      route: 'bundle/metaEdit/query/:id'
    },
    {
      route: 'bundle/propertyEdit/edit/:id'
    },
    {
      route: 'bundle/propertyEdit/new'
    },
    {
      route: 'bundle/publishLogEdit/new'
    },
    {
      route: 'bundle/publishLogEdit/query/:id'
    },
    {
      route: 'bundle/publishLogEdit/edit/:id'
    },
    {
      route: 'assethub/model/grayrelease/:id'
    },
    {
      route: 'assethub/model/monitor/:id'
    },
    {
      route: 'assethub/model/add'
    },
    {
      route: 'assethub/model/edit/:id'
    },
    {
      route: 'techBackstage/eventEdit'
    },
    {
      route: 'v2/techBackstage/dataHub'
    },
    {
      route: 'techBackstage/hbaseconfig'
    },
    {
      route: 'notify/template/manage'
    },
    {
      route: 'notify/center/:type'
    },
    {
      route: 'permission/package/add'
    },
    {
      route: 'permission/package/edit/:pkgCode'
    }
  ],
  'v2/olapAnalysis': [
    {
      route: 'olap/object/list'
    },
    {
      route: 'olap/object/search'
    },
    {
      route: 'olap/businessModel/list'
    },
    {
      route: 'olap/businessModel/debug'
    },
    {
      route: 'olap/object/edit/:code?'
    },
    {
      route: 'olap/object/attr/:code?'
    },
    {
      route: 'olap/businessModel/edit/:id?'
    }
  ]
};

/**
 * 需要测试的点
 * 1. 普通路由
 * 2. 普通匹配：'edit/:id'
 * 3. 汉字：'支持计算'
 * 4. '**'
 */
function getAppcodeFromHash(urlHash) {
  let appCode = '';
  // 初始化urlhash成统一格式： '/xx'
  let hash = decodeURI(urlHash);
  if (hash.indexOf('#/') >= 0) {
    hash = hash.replace('#/', '')
  }
  hash = '/' + hash;

  // routeMap循环
  Object.keys(ufHashMapData).forEach(key => {
    if (appCode) return;

    // routeMap- > route循环
    ufHashMapData[key].forEach(e => {
      if (appCode) return;

      let route = e.route.toLocaleLowerCase();
      // 初始化route，统一成'/xx'
      if (route.substr(0, 1) !== '/') {
        route = '/' + route;
      }
      if (route.indexOf('**') >= 0) {
        // 检测**之前的部分；并且hash长度大于route；
        const keys = [];
        route = route.replace('/**', '');
        const routeArr = route.split('/');
        const hashArr = hash.split('/');
        const hashWithAll = hashArr.splice(0, routeArr.length).join('/');
        const regexp = pathToRegexp(route, keys);
        if (regexp.exec(hashWithAll) && hashArr > routeArr) {
          appCode = key;
        }
      } else {
        // 如果匹配，返回
        const keys = [];
        const regexp = pathToRegexp(route, keys);
        if (regexp.exec(hash)) {
          appCode = key;
        }
      }
    })
  });
  // 处理key
  if (appCode) {
    appCode = appCode.replace('v2/', '');
    appCode = appCode.split('/')[0];
  }
  return appCode;
}

module.exports = getAppcodeFromHash;
