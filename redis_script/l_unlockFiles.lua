-------------------------------------------------------------------------------
-- © 2022 Eungsik Yoon <yoon.eungsik@gmail.com>
-------------------------------------------------------------------------------

local userName = ARGV[1]
local branch = ARGV[2]
local filePathsJson = ARGV[3]

-- Unlock all or nothing.
local filePaths = cjson.decode(filePathsJson)

-- First check if already locked by the user.
local userLocksKey = 'userLocks:' .. userName
for i = 1, #filePaths do
  local fileKey = branch .. ':' .. filePaths[i]
  if redis.call('HEXISTS', userLocksKey, fileKey) ~= 1 then
    return 'File [' .. filePaths[i] .. '] NOT locked by user [' .. userName .. ']'
  end
end

-- Unlock files.
for i = 1, #filePaths do
  local fileKey = branch .. ':' .. filePaths[i]
  redis.call('DEL', fileKey)

  redis.call('HDEL', userLocksKey, fileKey)
end

-- Return nil if successfully unlocked.
