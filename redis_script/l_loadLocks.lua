-------------------------------------------------------------------------------
-- © 2022 Eungsik Yoon <yoon.eungsik@gmail.com>
-------------------------------------------------------------------------------

local branch = ARGV[1]
local filePathsJson = ARGV[2]

local lockStates = {}

local filePaths = cjson.decode(filePathsJson)
for i = 1, #filePaths do
  local fileKey = branch .. ':' .. filePaths[i]
  local lockInfo = redis.call('HMGET', fileKey,
    'user', 'timestamp')

  if lockInfo[1] then
    lockStates[#lockStates + 1] = {
      user = lockInfo[1],
      timestamp = tonumber(lockInfo[2]),
    }
  else
    lockStates[#lockStates + 1] = {}
  end

end

return cjson.encode(lockStates)
