-------------------------------------------------------------------------------
-- © 2022 Eungsik Yoon <yoon.eungsik@gmail.com>
-------------------------------------------------------------------------------

local userName = ARGV[1]
local branch = ARGV[2]
local filePathsJson = ARGV[3]
local curTimeUtc = ARGV[4]

-- Lock all or nothing.
local filePaths = cjson.decode(filePathsJson)

-- First check if already locked by another user.
for i = 1, #filePaths do
  local lockKey = branch .. ':' .. filePaths[i]
  local lockUser = redis.call('HGET', lockKey, 'user')
  if lockUser and lockUser ~= userName then
    return 'File [' .. filePaths[i] .. '] locked by user [' .. lockUser .. ']'
  end
end

-- Lock all.
local userLocksKey = 'userLocks:' .. userName
for i = 1, #filePaths do
  local lockKey = branch .. ':' .. filePaths[i]
  local lockUser = redis.call('HMSET', lockKey,
    'user', userName,
    'timestamp', curTimeUtc)

  redis.call('HSET', userLocksKey, lockKey, 1)
end

-- Return nil if successfully locked.
