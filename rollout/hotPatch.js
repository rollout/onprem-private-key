module.exports = {
  "application": "579e1589d518bd6734e289f5",
  "bundle_id": "io.rollout.CertificateTest",
  "pending_test_devices": false,
  "analyticsBaseURL": "http://s3.amazonaws.com/analytic.rollout.io/development/q.gif",
  "_id": "57bd54ceb68da86a073def74",
  "tweak": {
    "sandbox_bundle_url": "https://localhost.rollout.io:9000/device/579e1589d518bd6734e289f6/57a061d951e22a634b6c8c69/tweaks_bundles/sandbox",
    "bundle": {
      "_id": "57bd54ceb68da86a073def72",
      "app_version": "57a061d951e22a634b6c8c69",
      "data": [{
        "class": "RolloutClient",
        "selector": "onApplicationStart",
        "methodType": "instance",
        "signature": "()->Void",
        "configurationType": "json",
        "configuration": [{
          "type": "normal",
          "returnValues": [],
          "actions": [{
            "timing": "before",
            "type": "alert",
            "data": {
              "button1": {"type": "close-message", "label": "Ok"},
              "message": "This is the message description. Do you agree?",
              "title": "On Premise"
            }
          }]
        }],
        "swizzlingType": "replaceImplementation",
        "gradualReleaseConfiguration": {"percentageOfDevices": 1, "actualPercentageToSwizzle": 0}
      }],
      "bucket": "production",
      "__v": 0,
      "creation_date": "2016-08-24T08:03:26.627Z"
    },
    "bundles": []
  },
  "structure": {"force_upload": 0, "upload_url": "https://localhost.rollout.io:9000/device/579e1589d518bd6734e289f6/57a061d951e22a634b6c8c69/structures"},
  "devices": {"mode": {"24562D1D-8E33-4CE9-B708-7FFF687B38D7": "sandbox"}},
  "application_version": {"id": "57a061d951e22a634b6c8c69", "release_version_number": "1.1", "rollout_api_version": "1.14.0"},
  "api_version": "1.0.0",
  "creation_date": "2016-08-24T08:03:26.804Z"
};