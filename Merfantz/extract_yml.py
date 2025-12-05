import yaml

class YamlAgentExtractor:
    def __init__(self, yaml_path):
        self.yaml_path = yaml_path
        self.data = self.load_yml()
        self.agents = self.extract_agents()

    def load_yml(self):
        with open(self.yaml_path, "r") as file:
            data = yaml.safe_load(file)
        return data

    def extract_agents(self):
        top_keys = list(self.data.keys())
        print("-------------Agents Extracted From YAML File-------------------")
        print(top_keys)
        print("-------------Agents Extracted From YAML File-------------------")
        return top_keys


if __name__ == "__main__":
    file_path = r"D:\agent-builder\Merfantz\utils\config.yml"

    # Open and load the YAML file
    with open(file_path, "r") as file:
        data = yaml.safe_load(file)
    agent_src_path = data.get("agent_path")
   # yaml_path = r"agent.yaml"
    extractor = YamlAgentExtractor(agent_src_path)
    final_agents = extractor.agents
    print("*** Final Agents:", final_agents)