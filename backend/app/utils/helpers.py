def parse_pr_url(pr_url: str):

    parts = pr_url.split("/")

    owner = parts[3]
    repo = parts[4]
    pr_number = int(parts[6])

    return owner, repo, pr_number