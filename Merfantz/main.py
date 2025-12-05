# from extract_yml import YamlAgentExtractor

# from utils.helper import save_base64_to_yaml, check_tool_in_yaml, get_top_keys_from_yaml, file_to_base64
# from fetch_tool import get_name_by_id


import yaml
import requests
import json
import base64
import os
import re

def agent_datas(data_json):
    """
    Create agent yaml file from the incoming JSON.
    """
    #-------------------------------------
    from files_api_1.create_agent_yaml import create_single_agent_yaml
    from files_api_1.db_api_1 import update_agent_src_base64
    from files_api_1.helper_api_1 import file_to_base64
    #-------------------------------------

    workflow_id_get = data_json.get("workflow_id")
    try:
        print("-------------API-1(step-2) --> Yaml file creation started---------------------")
        agent_yml_path = create_single_agent_yaml(data_json)
        print("-------------API-1(step-2) --> Yaml file creation completed-------------------")

        print("-------------API-1(step-3) --> Converting yaml to base64 process started------")
        base64_file_content = file_to_base64(agent_yml_path)
        print("-------------API-1(step-3) --> Converting yaml to base64 process completed------")

        print("-------------API-1(step-4) --> inserting base64 yaml content to db started------")
        update_agent_src_base64(workflow_id_get, base64_file_content)
        print("-------------API-1(step-4) --> inserting base64 yaml content to db completed------")

    except Exception as errr:
        print(f'Error while agent yaml - {errr}')

def task_datas(data_json):
    """
    Create task yaml file from the incoming JSON.
    """
    #-------------------------------------
    from files_api_2.create_task_yaml import create_single_task_yaml
    from files_api_2.db_api_2 import update_agent_src_base64
    from files_api_2.helper_api_2 import file_to_base64
    #------------------------------------

    workflow_id_get = data_json.get("workflow_id")
    
    try:
        print("-------------API-2(step-2) --> Yaml file creation started---------------------")
        task_yml_path = create_single_task_yaml(data_json)
        print("-------------API-2(step-2) --> Yaml file creation completed-------------------")

        print("-------------API-1(step-3) --> Converting yaml to base64 process started------")
        base64_file_content = file_to_base64(task_yml_path)
        print("-------------API-1(step-3) --> Converting yaml to base64 process completed------")

        print("-------------API-1(step-4) --> inserting base64 yaml content to db started------")
        update_agent_src_base64(workflow_id_get, base64_file_content)
        print("-------------API-1(step-4) --> inserting base64 yaml content to db completed------")
          
    except Exception as errr:
        print(f'Error while task yaml - {errr}')

def create_python_file_and_update(input_json, workflow_id):
    #------------------------------------
    from files_api_3.db_api_3 import insert_python_file, modify_json_with_base_tool_ids
    from files_api_3.create_runner import save_runner
    from files_api_3.helper_api_3 import api3_prep
    #------------------------------------
    try:
        print("-------------API-3(step-2) --> Preparing json process started-------------------")
        json_file_datas = api3_prep(input_json)
        #json_file_datas = modify_json_with_base_tool_ids(json_file_datas)
        #json_file_datas = reorder_env_datas(json_file_datas)
        print("-------------API-3(step-2) --> Preparing json process completed-------------------")
    except Exception as json_prep_err:
        print(f'Error while preparing json data for python file creation --- {json_prep_err}')

    try:
        print("-------------API-3(step-3) --> Generating runner file and inserting process started-------------------")
        print(json_file_datas)
        
        save_runner(json_file_datas)
        insert_python_file(workflow_id)
        print("-------------API-3(step-3) --> Generating runner file and inserting process completed-------------------")
    except Exception as runn_insert_err:
        print(f'Error while generating runner file and insertion process --- {runn_insert_err}')
    
    return None

def create_python_runner(json_data_input):

    #--------------------------------------
    from files_api_3.db_api_3 import get_runner_file
    from agent_builder.utils.process_manager import start_runner_for_workflow
    #--------------------------------------
    workflow_id = json_data_input.get("workflow_id")

    # create_python_file_and_update(json_data_input, workflow_id)
    # #prepared_json = get_file_datas(workflow_id)

    # print("-------------API-3(step-4) --> fetching runner base64 from db started-------------------")
    # path_runner = get_runner_file(workflow_id)
    # print("-------------API-3(step-4) --> fetching runner base64 from db completed-------------------")
    
    # try:
    #     print("-------------API-3(step-5) --> converting base64 to py file and saving started---------")
    #     runner_code = base64.b64decode(path_runner)
    #     print(f'Passing this code----{runner_code}')
    #     folder_path = r"D:\agent-builder\Merfantz\run\configs"
    #     os.makedirs(folder_path, exist_ok=True)

    #     # Define the file name (you can include workflow_id if you want unique names)
    #     file_name = f"runner_{workflow_id}.py"
    #     file_path = os.path.join(folder_path, file_name)
    #     # Write decoded content to file
    #     with open(file_path, "wb") as f:
    #         f.write(runner_code)
    #     print("-------------API-3(step-5) --> converting base64 to py file and saving completed--------")
    # except Exception as conv_err:
    #     print(f'Error while converting base64 to py file : {conv_err}')

    try:
        print("-------------API-3(step-5) --> Starting Subprocess--------")
        file_path = r"D:\agent-builder\Merfantz\src\tools\demo_2.py"
        result = start_runner_for_workflow(workflow_id, file_path)
        print("Workflow started:", json.dumps(result, indent=4))
        print("-------------API-3(step-5) --> Completed Subprocess--------")
        return result
    except Exception as sub_start_err:
        print(f'Error occurred during starting subprocess : {sub_start_err}')

    