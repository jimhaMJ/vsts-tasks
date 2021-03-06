import ma = require('vsts-task-lib/mock-answer');
import tmrm = require('vsts-task-lib/mock-run');
import path = require('path');

let taskPath = path.join(__dirname, '..', 'deployiiswebapp.js');
let tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);
tr.setInput('WebSiteName', 'mytestwebsite');
tr.setInput('Package', 'webAppPkg.zip');
tr.setInput('XmlTransformation', 'true');

process.env['TASK_TEST_TRACE'] = 1;
process.env["SYSTEM_DEFAULTWORKINGDIRECTORY"] =  "DefaultWorkingDirectory";

// provide answers for task mock
let a: ma.TaskLibAnswers = <ma.TaskLibAnswers>{
    "which": {
        "cmd": "cmd",
        "msdeploy": "msdeploy"
    },
    "stats": {
    	"webAppPkg.zip": {
    		"isFile": true
    	}
    },
    "osType": {
        "osType": "Windows"
    },
    "checkPath": {
        "cmd": true,
        "webAppPkg.zip": true,
        "webAppPkg": true,
        "msdeploy": true
    },
    "exec": {        
        "msdeploy -verb:getParameters -source:package=\'DefaultWorkingDirectory\\temp_web_package.zip\'": {
            "code": 0,
            "stdout": "Executed Successfully"
        },
        "cmd /C DefaultWorkingDirectory\\cttCommand.bat": {
            "code": 1,
            "stderr": "ctt execution failed"
        },
        "msdeploy -verb:sync -source:package=\'DefaultWorkingDirectory\\temp_web_package.zip\' -dest:auto -setParam:name=\'IIS Web Application Name\',value=\'mytestwebsite\' -enableRule:DoNotDeleteRule": {
            "code": 0,
            "stdout": "Executed Successfully"
        }
    },
    "rmRF": {
        "temp_web_package_random_path": {
            "success": true
        },
        "DefaultWorkingDirectory\temp_web_package.zip": {
            "success": true
        }
    },
    "exist": {
    	"webAppPkg.zip": true,
        "webAppPkg": true
    }, 
    "findMatch": {
        "webAppPkgPattern" : ["webAppPkg1", "webAppPkg2"],
        "Invalid_webAppPkg" : [],
        "webAppPkg.zip": ["webAppPkg.zip"],
        "webAppPkg": ["webAppPkg"],
        "**/*.config": ["web.config", "web.Release.config", "web.Debug.config"]
    },
    "getVariable": {
    	"ENDPOINT_AUTH_AzureRMSpn": "{\"parameters\":{\"serviceprincipalid\":\"spId\",\"serviceprincipalkey\":\"spKey\",\"tenantid\":\"tenant\"},\"scheme\":\"ServicePrincipal\"}",
   		"ENDPOINT_DATA_AzureRMSpn_SUBSCRIPTIONNAME": "sName", 
    	"ENDPOINT_DATA_AzureRMSpn_SUBSCRIPTIONID": "sId",
    	"AZURE_HTTP_USER_AGENT": "TFS_useragent",
        "System.DefaultWorkingDirectory": "DefaultWorkingDirectory",
		"build.sourceVersion": "46da24f35850f455185b9188b4742359b537076f",
		"build.buildId": 1,
		"release.releaseId": 1,
		"build.buildNumber": 1,
		"release.releaseName": "Release-1",
		"build.repository.provider": "TfsGit",
		"build.repository.name": "MyFirstProject",
		"system.TeamFoundationCollectionUri": "https://abc.visualstudio.com/",
		"system.teamProject": "MyFirstProject",
		"build.sourceVersionAuthor": "author",
		"release.releaseUri": "vstfs:///ReleaseManagement/Release/1",
		"agent.name": "agent"
    }
};

import mockTask = require('vsts-task-lib/mock-task');

var msDeployUtility = require('webdeployment-common/msdeployutility.js'); 
tr.registerMock('./msdeployutility.js', {
    getMSDeployCmdArgs : msDeployUtility.getMSDeployCmdArgs,
    getMSDeployFullPath : function() {
        var msDeployFullPath =  "msdeploypath\\msdeploy.exe";
        return msDeployFullPath;
    },
    containsParamFile: function(webAppPackage: string) {
        var taskResult = mockTask.execSync("msdeploy", "-verb:getParameters -source:package=\'" + webAppPackage + "\'");
        return true;
    }
}); 

tr.registerMock('webdeployment-common/ziputility.js', {
    unzip: function() {

    },
    archiveFolder: function() {
        return "DefaultWorkingDirectory\\temp_web_package.zip"
    }
});

tr.registerMock('webdeployment-common/utility.js', {
    isInputPkgIsFolder: function() {
        return false;    
    },
    fileExists: function() {
        return true;   
    },
    canUseWebDeploy: function() {
        return true;
    },
    findfiles: function() {
        return ['webDeployPkg']    
    },
    generateTemporaryFolderOrZipPath: function() {
        return 'temp_web_package_random_path';
    }
});

var fs = require('fs');
tr.registerMock('fs', {
    createWriteStream: function (filePath, options) {
        return { "isWriteStreamObj": true };
    },
    ReadStream: fs.ReadStream,
    WriteStream: fs.WriteStream,
    openSync: function (fd, options) {
        return true;
    },
    closeSync: function (fd) {
        return true;
    },
    fsyncSync: function(fd) {
        return true;
    }
});

tr.setAnswers(a);
tr.run();