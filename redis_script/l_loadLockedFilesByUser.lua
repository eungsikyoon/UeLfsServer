-------------------------------------------------------------------------------
-- © 2022 Eungsik Yoon <yoon.eungsik@gmail.com>
-------------------------------------------------------------------------------

local userName = ARGV[1]

local userLocksKey = 'userLocks:' .. userName
local lockedFiles = redis.call('HKEYS', userLocksKey)

if #lockedFiles == 0 then
  return nil
end

return cjson.encode(lockedFiles)
