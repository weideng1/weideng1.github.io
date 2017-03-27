#!/usr/bin/env python
# Example provisioning API usage script.  (C) DataStax, 2015.  All Rights Reserved
#
# Pass the server ip as the first argument and the target nodes as additional arguments
#
# Example Usage:
#
#   ctool-lcm-setup.py (target node ip one) (target node ip two...)

import os
import sys
import requests
import json
import threading

# Configurable Global variables
with open('lcm_server', 'r') as myfile:
	server_ip=myfile.read().strip()
base_url = 'http://%s:8888/api/v1/lcm/' % server_ip

print str(sys.argv)

def do_post(url, post_data):
    result = requests.post(base_url + url,
                           data=json.dumps(post_data),
                           headers={'Content-Type': 'application/json'})
    print repr(result.text)
    result_data = json.loads(result.text)
    return result_data

repository_response = do_post("repositories/",
    {"name": "dse-repo",
        "username": "<your DSA username>",
        "password": "<your DSA password>"})
repository_id = repository_response['id']

# ssh private key example
with open('ctool_key', 'r') as myfile:
        privateKey=myfile.read()
machine_credential_response = do_post("machine_credentials/",
     {"name": "ctool-key",
      "login-user": "automaton",
      "become-mode": "sudo",
      "ssh-private-key": privateKey
    }
)
machine_credential_id = machine_credential_response['id']

cluster_profile_response = do_post("config_profiles/",
    {"name": "dse-cluster",
     "datastax-version": "5.0.7",
     "json": {'cassandra-yaml': {'endpoint_snitch': 'org.apache.cassandra.locator.GossipingPropertyFileSnitch'},
              'logback-xml': {'loggers': [{'name': 'com.thinkaurelius.thrift', 'level': 'INFO'}]},
              'dse-yaml': {'back_pressure_threshold_per_core': 501}},
     "comment": "LCM Demo"})
cluster_profile_id = cluster_profile_response['id']

make_cluster_response = do_post("clusters/",
    {"name": "DSE-Cluster",
     "repository-id": repository_id,
     "config-profile-id": cluster_profile_id})
cluster_id = make_cluster_response['id']

make_dc_response = do_post("datacenters/",
    {"name": "DC1",
     "cluster-id": cluster_id,
     "config-profile-id": cluster_profile_id,
     "solr-enabled": True,
     "graph-enabled": True})
dc_id = make_dc_response['id']

for host in sys.argv[1:]:
    node_ip = host.split(":")[0]
    private_ip = host.split(":")[1]
    make_node_response = do_post("nodes/",
        {"name": node_ip,
         "listen-address": private_ip,
         "rpc-address": private_ip,
	 "broadcast-address": node_ip,
         "broadcast-rpc-address": node_ip,
         "ssh-management-address": node_ip,
         "datacenter-id": dc_id,
         "config-profile-id": cluster_profile_id,
         "machine-credential-id": machine_credential_id,
         "rack": "rack1"})

print("http://%s:8888" % server_ip)
