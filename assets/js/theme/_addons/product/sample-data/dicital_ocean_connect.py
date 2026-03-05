from app import db, app
import boto3, botocore, os
from app.send_email import send_email

###################################################################################
#
#   Best practices for dealing with S3 Buckets here: https://docs.digitalocean.com/reference/api/spaces-api/
#   Also here: https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/s3/client/get_object.html
#
###################################################################################


def create_s3_session(**kwargs):

    region_name = 'sfo2'
    if 'region_name' in kwargs:
        region_name = kwargs['region_name']
    
    endpoint_url = f'https://{region_name}.digitaloceanspaces.com'
    aws_access_key_id = app.config['S3_ACCESS_KEY']
    aws_secret_access_key = app.config['S3_SECRET_KEY']

    session = boto3.session.Session()
    client = session.client('s3',
        endpoint_url=endpoint_url, # Find your endpoint in the control panel, under Settings. Prepend "https://".
        config=botocore.config.Config(s3={'addressing_style': 'virtual'}), # Configures to use subdomain/virtual calling format.
        region_name=region_name, # Use the region in your endpoint.
        aws_access_key_id=aws_access_key_id, # Access key pair. You can create access key pairs using the control panel or API.
        aws_secret_access_key=aws_secret_access_key) # Secret access key defined through an environment variable.
    
    return client


def add_to_s3_bucket(**kwargs):

    space_name = 'qty-backup'
    if 'space_name' in kwargs:
        space_name = kwargs['space_name']

    '''options for privacy are "private" or "public-read"'''
    privacy = 'private'
    if 'privacy' in kwargs:
        privacy = kwargs['privacy']

    source_file_path = kwargs['source_file_path']
    if not os.path.isfile(source_file_path):
        return {'status':404, 'msg':f'Missing source_path: {source_file_path}'}

    file_name = os.path.basename(source_file_path)
    file_path = os.path.dirname(source_file_path)

    if 'target_file_path' in kwargs:
        target_file_path = kwargs['target_file_path']
    else:
        target_file_path = f'{file_name}'

    params = {}
    if 'region_name' in kwargs:
        params['region_name'] = kwargs['region_name']

    # print('source_file_path',source_file_path)
    # print('target_file_path',target_file_path)
    # print('file_name',file_name)
    # print('file_path',file_path)
    # print('privacy',privacy)

    extra_args = {'ACL': privacy, 'CacheControl': 'public, max-age=0, must-revalidate'}

    client = create_s3_session(**params)
    client.upload_file(
        source_file_path,
        space_name,
        target_file_path,
        ExtraArgs=extra_args
        )
    
    status = 200
    message = f'Copied to Digital Ocean: {target_file_path}'

    return {'status':status, 'msg':message}


def list_s3_bucket_files(**kwargs):

    space_name = 'qty-backup'
    if 'space_name' in kwargs:
        space_name = kwargs['space_name']

    folder = ''
    if 'folder' in kwargs:
        folder = kwargs['folder']

    max_keys = 20
    if 'max_keys' in kwargs:
        max_keys = kwargs['max_keys']

    params = {}
    if 'region_name' in kwargs:
        params['region_name'] = kwargs['region_name']

    client = create_s3_session(**params)

    paginator = client.get_paginator('list_objects_v2')
    
    # This creates an iterable so you don't have to manage tokens manually
    page_iterator = paginator.paginate(
        Bucket=space_name,
        EncodingType='url',
        MaxKeys=max_keys,
        Prefix=f'{folder}',
        FetchOwner=True|False,
        RequestPayer='requester',
        )

    page_collection = []
    for page in page_iterator:
        page_collection += page['Contents']

    return page_collection


def get_s3_bucket_file(**kwargs):

    space_name = 'qty-backup'
    if 'space_name' in kwargs:
        space_name = kwargs['space_name']
    file_name = kwargs['file_name']

    # print('get_s3_bucket_file file_name',file_name)
    # print('get_s3_bucket_file space_name',space_name)

    params = {}
    if 'region_name' in kwargs:
        params['region_name'] = kwargs['region_name']
    else:
        params['region_name'] = 'sfo3'

    client = create_s3_session(**params)

    return client.get_object(
        Bucket=space_name,
        Key=file_name,
    )


def delete_s3_bucket_file(**kwargs):

    space_name = 'qty-backup'
    if 'space_name' in kwargs:
        space_name = kwargs['space_name']
    file_name = kwargs['file_name']

    expected_owner = 'string'
    if 'expected_owner' in kwargs:
        expected_owner = kwargs['expected_owner']

    client = create_s3_session()
    return client.delete_object(
        Bucket=space_name,
        Key=file_name,
        # MFA='string',
        # VersionId='string',
        # RequestPayer='requester',
        # BypassGovernanceRetention=True|False,
        ExpectedBucketOwner=expected_owner
    )